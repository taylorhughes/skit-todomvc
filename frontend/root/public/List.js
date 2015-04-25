'use strict';

var dom = skit.browser.dom;
var events = skit.browser.events;
var Controller = skit.platform.Controller;
var cookies = skit.platform.cookies;
var iter = skit.platform.iter;
var navigation = skit.platform.navigation;
var Handlebars = skit.thirdparty.handlebars;

var TodoAPIClient = library.TodoAPIClient;

// This loads List.html so we can render the main content for the page.
var html = __module__.html;
var footerHtml = __module__.footer.html;
var itemHtml = __module__.item.html;


var COOKIE_NAME = 'skit-task-list-id';
var KEYCODE_ENTER = 13;


Handlebars.registerHelper('pluralize', function(count, singular, plural) {
  return count == 1 ? singular : plural;
});
Handlebars.registerHelper('ifEqual', function(a, b, opts) {
  if (a == b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});


return Controller.create({
  __preload__: function(done) {
    var listId = cookies.get(COOKIE_NAME);
    if (!listId) {
      this.list = null;
      this.items = [];

      done();
      return;
    }

    TodoAPIClient.getList(listId, {
      success: function(list, items) {
        this.list = list;
        this.items = items;
      },
      error: function() {
        navigation.notFound();
      },
      complete: done,
      context: this
    });
  },

  __title__: function() {
    return 'Skit TodoMVC';
  },

  __body__: function() {
    var anyCompleted = false;
    var remaining = 0;
    iter.forEach(this.items, function(item) {
      if (item.completed) {
        anyCompleted = true;
      } else {
        remaining += 1;
      }
    });

    return html({
      items: this.filterItems(this.items),
      remaining: remaining,
      anyCompleted: anyCompleted,
      filterName: this.filterName
    });
  },

  __ready__: function(container) {
    var app = dom.get('#todoapp');
    events.delegate(app, '[data-action]', 'click', this.onClickAction, this);
    var newItem = dom.get('#new-todo');
    events.bind(newItem, 'keyup', this.onKeyupNewItem, this);

    if (!this.list) {
      TodoAPIClient.newList({
        success: function(list) {
          this.list = list;
          cookies.set(COOKIE_NAME, list.id);
        },
        error: function() {
          alert('Something went wrong creating a new list in the backend!\n\nPlease try again later.');
        },
        context: this
      });
    }
  },

  filterName: 'all',
  filterItems: function(items) {
    return items;
  },

  itemById: function(itemId) {
    return iter.find(this.items, function(item) {
      return item.id == itemId;
    });
  },

  purgeCompleted: function() {
    var oldItems = this.items.slice();
    this.items = iter.filter(this.items, function(item) {
      return !item.completed;
    });
    this.rerender();

    TodoAPIClient.purgeCompletedItems(this.list.id, {
      error: function() {
        this.items = oldItems;
        this.rerender();
      },
      context: this
    })
  },

  markAllCompleted: function() {
    var hasAnyActive = false;
    iter.forEach(this.items, function(item, i, stop) {
      if (!item.completed) {
        hasAnyActive = true;
        stop();
      }
    });

    var completed = hasAnyActive;
    var changed = [];
    iter.forEach(this.items, function(item) {
      if (item.completed != completed) {
        item.completed = completed;
        changed.push(item);
      }
    });

    this.rerender();

    TodoAPIClient.markAllCompleted(this.list.id, completed, {
      error: function() {
        iter.forEach(changed, function(item) {
          item.completed = !completed;
        });
        this.rerender();
      },
      context: this
    })
  },

  // Event handlers

  onClickAction: function(evt) {
    var $target = evt.currentTarget;
    var action = $target.getData('action');
    var $item = $target.up('[data-item-id]');
    var item = null;
    if ($item) {
      var itemId = $item.getData('item-id');
      item = this.itemById(itemId);
    }

    switch (action) {
      case 'mark-all-completed':
        this.markAllCompleted();
        break;

      case 'purge-completed':
        this.purgeCompleted();
        break;

      case 'complete-item':
        item.completed = !item.completed;
        this.rerender();
        TodoAPIClient.markItemCompleted(this.list.id, item.id, item.completed);
        break;

      case 'destroy-item':
        this.items = iter.filter(this.items, function(anItem) {
          return item !== anItem;
        });
        this.rerender();
        break;

      case 'edit-item':

        break;
    }
  },

  onKeyupNewItem: function(evt) {
    if (evt.keyCode != KEYCODE_ENTER) {
      return;
    }
    evt.preventDefault();

    var $item = evt.target;
    var text = $item.value();
    if (!text) {
      return;
    }

    var tempId = +(new Date());
    var added = {id: null, text: text, completed: false, tempId: tempId};
    this.items.push(added);
    this.rerender();

    dom.get('input[autofocus]').element.focus();

    TodoAPIClient.newItem(this.list.id, text, {
      success: function(newItem) {
        // Replace temporary item with real saved item from remote datasource.
        this.items = iter.map(this.items, function(item) {
          if (item.tempId == tempId) {
            return newItem;
          }
          return item;
        });
      },
      error: function() {
        // Remove the item we added -- something went wrong.
        this.items = iter.filter(this.items, function(item) {
          return item.tempId != tempId;
        });
      },
      context: this
    })
  }
});
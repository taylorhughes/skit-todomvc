'use strict';

var navigation = skit.platform.navigation;
var net = skit.platform.net;
var urls = skit.platform.urls;


function TodoAPIClient() {}


TodoAPIClient.prototype.baseUrl_ = function() {
  if (!this.baseUrl) {
    var parsed = urls.parse(navigation.url());
    if (parsed.port && parsed.port != 80 && parsed.port != 443) {
      // running in dev mode.
      this.baseUrl = 'http://localhost:15080/';
    } else {
      this.baseUrl = 'https://skit-todomvc.appspot.com/';
    }
  }

  return this.baseUrl;
};

TodoAPIClient.prototype.send_ = function(path, options) {
  var handleResponse = function(response) {
    var data = response.body;
    var parsed;
    var success = false;
    if (response.status == 200) {
      success = true;
      parsed = (options.parse || function(d) { return [d]; }).call(this, data);
    } else {
      parsed = [];
    }

    var callbacks = options.callbacks || {};
    if (success) {
      if (callbacks.success) {
        callbacks.success.apply(callbacks.context, parsed);
      }
    } else {
      if (callbacks.error) {
        callbacks.error.call(callbacks.context, response.status, data);
      }
    }

    if (callbacks.complete) {
      callbacks.complete.apply(callbacks.context, parsed);
    }
  };

  var params = {};
  for (var k in options.params) {
    if (options.params[k]) {
      params[k] = options.params[k];
    }
  }

  net.send(this.baseUrl_() + path, {
    method: options.method,
    params: params,
    complete: handleResponse,
    context: this
  });
};

TodoAPIClient.prototype.newList = function(callbacks) {
  this.send_('lists', {
    method: 'POST',
    parse: function(data) {
      return [data['list']];
    },
    callbacks: callbacks
  });
};

TodoAPIClient.prototype.purgeCompletedItems = function(listId, callbacks) {
  this.send_('lists/' + listId + '/purge-completed', {
    method: 'POST',
    parse: function(data) {
      return [data['list'], data['items']];
    },
    callbacks: callbacks
  });
};


TodoAPIClient.prototype.markAllCompleted = function(listId, callbacks) {
  this.send_('lists/' + listId + '/mark-all-completed', {
    method: 'POST',
    parse: function(data) {
      return [data['list'], data['items']];
    },
    callbacks: callbacks
  });
};

TodoAPIClient.prototype.getList = function(id, callbacks) {
  this.send_('lists/' + id, {
    method: 'GET',
    parse: function(data) {
      return [data['list'], data['items']];
    },
    callbacks: callbacks
  });
};

TodoAPIClient.prototype.newItem = function(listId, text, callbacks) {
  this.send_('lists/' + listId, {
    method: 'POST',
    params: {'text': text},
    parse: function(data) {
      return [data['item']];
    },
    callbacks: callbacks
  });
};

TodoAPIClient.prototype.markItemCompleted = function(listId, itemId, callbacks) {
  this.send_('lists/' + listId + '/' + itemId, {
    method: 'POST',
    params: {'completed': '1'},
    parse: function(data) {
      return [data['item']];
    },
    callbacks: callbacks
  });
};

TodoAPIClient.prototype.editItem = function(listId, itemId, text, callbacks) {
  this.send_('lists/' + listId + '/' + itemId, {
    method: 'POST',
    params: {'text': text},
    parse: function(data) {
      return [data['item']];
    },
    callbacks: callbacks
  });
};


return new TodoAPIClient();

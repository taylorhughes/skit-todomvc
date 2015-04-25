
var Controller = skit.platform.Controller;
var iter = skit.platform.iter;

var List = public.List;


module.exports = Controller.create(List, {
  filterName: 'completed',
  filterItems: function(items) {
    return iter.filter(items, function(item) {
      return item.completed;
    });
  }
});
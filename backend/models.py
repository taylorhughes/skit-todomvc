
from google.appengine.ext import blobstore
from google.appengine.ext import db


class TodoList(db.Model):
  task_count = db.IntegerProperty()

  remote_addr = db.StringProperty()
  referer = db.StringProperty()

  def to_dict(self):
    return {
      'id': self.key().id(),
      'taskCount': self.task_count,
    }


class TodoItem(db.Model):
  create_time = db.DateTimeProperty(auto_now_add=True)
  text = db.StringProperty()
  completed = db.BooleanProperty()

  def to_dict(self):
    return {
      'id': self.key().id(),
      'text': self.text,
      'completed': self.completed,
    }

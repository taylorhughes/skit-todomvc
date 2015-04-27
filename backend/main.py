#!/usr/bin/env python

import json
import webapp2

from google.appengine.ext import db

from models import TodoItem
from models import TodoList



class BaseHandler(webapp2.RequestHandler):
  def dispatch(self):
    # Allow these handlers to be accessed from anywhere.
    self.response.headers['Access-Control-Allow-Origin'] = '*'
    self.response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, DELETE'
    super(BaseHandler, self).dispatch()

  def options(self, *args):
    # This allows the Allow-Origin header to be returned.
    pass

  def json(self, obj):
    self.response.headers['Content-Type'] = 'application/json'
    self.response.write(json.dumps(obj))

  def bad_request(self, obj):
    self.response.status = 400
    self.json(obj)

  def not_found(self):
    self.response.status = 404
    self.json({'message': 'Not Found'})


class CreateListHandler(BaseHandler):
  def post(self):
    # create new list, return id
    new_list = TodoList()
    new_list.task_count = 0
    new_list.remote_addr = self.request.remote_addr
    new_list.referer = self.request.headers.get('Referer')
    new_list.put()

    self.json({'list': new_list.to_dict()})



def _list_handler_method(method):
  def list_handler_method(self, *args):
    list_id = args[0]
    list_id = long(list_id)
    my_list = TodoList.get_by_id(list_id)
    if not my_list:
      self.not_found()
      return

    args = list(args)
    args[0] = my_list
    return method(self, *args)

  return list_handler_method


class ListHandler(BaseHandler):
  @_list_handler_method
  def get(self, my_list):
    items = db.query_descendants(my_list)
    items = sorted(items, key=lambda i: i.create_time)
    self.json({'list': my_list.to_dict(), 'items': [i.to_dict() for i in items]})

  @db.transactional
  @_list_handler_method
  def post(self, my_list):
    if my_list.task_count >= 100:
      self.bad_request()
      return

    text = self.request.get('text')
    if not text:
      self.bad_request()
      return

    item = TodoItem(parent=my_list, text=text, completed=False)
    my_list.task_count += 1
    my_list.put()
    item.put()

    self.json({'item': item.to_dict()})


class MarkAllCompletedListHandler(BaseHandler):
  @_list_handler_method
  def post(self, my_list):
    items = db.query_descendants(my_list)

    completed = self.request.get('completed') != '0'

    to_put = []
    for item in items:
      if item.completed != completed:
        item.completed = completed
        to_put.append(item)
    if to_put:
      # Saves all the items at once.
      db.put(to_put)

    self.json({'list': my_list.to_dict(), 'items': [i.to_dict() for i in items]})

class PurgeCompletedListHandler(BaseHandler):
  @db.transactional
  @_list_handler_method
  def post(self, my_list):
    items = db.query_descendants(my_list)

    to_delete = []
    for item in items:
      if item.completed:
        to_delete.append(item)
        my_list.task_count -= 1

    if to_delete:
      my_list.put()
      db.delete(to_delete)

    self.json({'list': my_list.to_dict(), 'items': [i.to_dict() for i in items]})


def _task_handler_method(method):
  def task_handler_method(self, my_list, task_id):
    task_id = long(task_id)
    task = TodoItem.get_by_id(task_id, parent=my_list)
    if not task:
      self.not_found()
      return

    return method(self, my_list, task)
  return _list_handler_method(task_handler_method)

class EditTaskHandler(BaseHandler):
  @_task_handler_method
  def post(self, my_list, task):
    text = self.request.get('text', default_value=None)
    if text is not None:
      task.text = text
    completed = self.request.get('completed', default_value=None)
    if completed is not None:
      task.completed = completed == '1'
    task.put()

    self.json({'task': task.to_dict()})

  @db.transactional
  @_task_handler_method
  def delete(self, my_list, task):
    my_list.task_count -= 1
    my_list.put()
    task.delete()

    self.json({'list': my_list.to_dict()})


app = webapp2.WSGIApplication([
    (r'/lists', CreateListHandler),
    (r'/lists/(\d+)', ListHandler),
    (r'/lists/(\d+)/mark-all-completed', MarkAllCompletedListHandler),
    (r'/lists/(\d+)/purge-completed', PurgeCompletedListHandler),
    (r'/lists/(\d+)/(\d+)', EditTaskHandler),
], debug=True)

# skit-todomvc

A <a href="http://todomvc.com/">TodoMVC</a> example in <a href="http://skitjs.com/">skit</a>.

Skit is a client-only framework that also runs on the server, so I built a backend API for TodoMVC to create lists and store tasks, which are loaded with a list ID stored in a cookie.

If you save a task a refresh the page, the task will be rendered on the server side. If you create a new task, it will be rendered in the browser, using the same Handlebars template (<a href="https://github.com/taylorhughes/skit-todomvc/blob/master/frontend/root/public/List_item.html">frontend/root/public/List_item.html</a>).

## backend

The backend is a Google App Engine project written in python that creates a super simple REST interface for creating and modifying task lists. This is not a skit project, but necessary to demonstrate what skit is designed for.

## frontend

The frontend is a simple skit project that renders the task list and calls into the backend API to update the task list state. This example uses no client-side libraries besides skit. In real life you might want to use React or some kind of other client-side data-layer / sync framework; I just wanted to show what was possible without any additional libraries.

Files of note:

* <a href="https://github.com/taylorhughes/skit-todomvc/blob/master/frontend/root/library/TodoAPIClient.js">__root/library/TodoAPIClient.js__</a> - this is the API client for the backend mentioned above. Note that it uses __skit.platform.net__ module to issue HTTP calls from the server and browser.
* <a href="https://github.com/taylorhughes/skit-todomvc/blob/master/frontend/root/public/List.js">__root/public/List.js__</a> - this is the task list page. this is responsible for fetching the task list and rendering it, as well as the logic around updating the list. Note that it uses __skit.platform.cookies__ to store/read cookies on the server and client.
* <a href="https://github.com/taylorhughes/skit-todomvc/blob/master/frontend/root/public/completed/Completed.js">__root/public/completed/Completed.js__</a> - This (and Active.js) inherit from List.js, showing the exact same page as List.js but at a different URL and with fewer items displayed.
 
# How to run

Run locally by:

1. Installing Google App Engine launcher __for python__ here: <a href="https://cloud.google.com/appengine/downloads">Google App Engine downloads</a>
2. In App Engine Launcher, import an existing project (the <code>backend</code> folder) and press play
3. In <code>frontend</code> folder, run the project:

    $ cd frontend
    $ npm install
    $ ./node_modules/.bin/skit run

Voilà, you should be up and running.



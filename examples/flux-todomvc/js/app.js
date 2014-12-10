/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('react');

var TodoApp = require('./components/TodoApp.react');
var TodoStore = require('./stores/TodoStore');

var todoStore = new TodoStore();




React.withContext({
  todoStore: todoStore
}, function () {
  React.render(
    <TodoApp />,
    document.getElementById('todoapp')
  );
});
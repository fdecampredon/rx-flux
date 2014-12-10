/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoStore
 */

var TodoActions = require('../actions/TodoActions');
var Store = require('rx-flux').Store;
var assign = require('object-assign');


function updateTodos(todos, update, condition) {
  return Object.keys(todos).reduce(function (result, id) {
    var todo = todos[id];
    if (!condition || condition(todo)) {
      result[id] = assign({}, todo, update);
    } else {
      result[id] = todo;
    }
    return result;
  }, {});
}

function TodoStore() {
  Store.call(this);
  this.setValue({});
}

TodoStore.prototype = Object.create(Store.prototype);

assign(TodoStore.prototype, {
  constructor: TodoStore,
  
  init: function () {
    var store = this;
    
    
    store.observe(TodoActions.create, function (text) {
      store.applyOperation(function (todos) {
        todos = assign({}, todos);
        
        var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
        todos[id] = {
          id: id,
          complete: false,
          text: text
        };
        return todos;
      }, true);
    });
    
    store.observe(TodoActions.toggleCompleteAll, function () {
      store.applyOperation(function (todos) {
        var allCompleted = Object.keys(todos).every(function (id) {
          return todos[id].complete;
        });
        
        return updateTodos(todos, {complete: !allCompleted}, function (todo) {
          return todo.complete === allCompleted;
        });
      }, true);
    });
    
    
    store.observe(TodoActions.toggleComplete, function (id) {
      store.applyOperation(function (todos) {
        return updateTodos(todos, {complete: !todos[id].complete}, function (todo) {
          return todo.id === id;
        });
      }, true);
    });
    
    store.observe(TodoActions.updateText, function (update) {
      var id = update.id;
      var text = update.text;
      store.applyOperation(function (todos) {
        return updateTodos(todos, {text: text}, function (todo) {
          return todo.id === id;
        });
      });
    });
    
    
    store.observe(TodoActions.destroy, function (id) {
      store.applyOperation(function (todos) {
        todos = assign({}, todos);
        delete todos[id];
        return todos;
      }, true);
    });
    
    
    store.observe(TodoActions.destroyCompleted, function () {
      store.applyOperation(function (todos) {
        return Object.keys(todos).reduce(function (result, id) {
          var todo = todos[id];
          if (!todo.complete) {
            result[id] = todo;
          }
          return result;
        }, {});
      });
    });
  }

});

module.exports = TodoStore;

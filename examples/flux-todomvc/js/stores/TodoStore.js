
var Store = require('rx-flux').Store;
var Rx = require('rx');
var TodoService = require('../services/todoService');
var TodoActions = require('../actions/todoActions');

    
function updateTodos(todos, update, condition) {
  return Object.keys(todos).reduce(function (result, id) {
    var todo = todos[id];
    if (!condition || condition(todo)) {
      result[id] = { ...todo, ...update};
    } else {
      result[id] = todo;
    }
    return result;
  }, {});
}


var TodoStore = Store.create({
  getInitialValue() {
    return TodoService.getTodos();
  },
  
  getOperations() {
    return Rx.Observable.merge(

      TodoActions.create
        .map(function ({todo, promise}) {
          return {
            transform: function (todos) {
              todos = {...todos};
              todos[todo.id] =  todo;
              return todos;
            },
            confirm: promise
          };
        }),

      TodoActions.toggleCompleteAll
        .map(function ({promise}) {
          return {
            transform: function (todos) {
              var allCompleted = Object.keys(todos).every(id => todos[id].complete);

              return updateTodos(
                todos, 
                { complete: !allCompleted }, 
                todo => todo.complete === allCompleted
              );
            },
            confirm: promise
          };
        }),

      TodoActions.toggleComplete
        .map(function({id, promise}) {
          return {
            transform: todos => 
              updateTodos(
                todos, 
                { complete: !todos[id].complete }, 
                todo => todo.id === id
              ),
            confirm: promise
          };
        }),

      TodoActions.updateText
        .map(function ({id, text, promise}) {
          return {
            transform: todos => 
              updateTodos(
                todos, 
                { text }, 
                todo => todo.id === id
              ),
            confirm: promise
          };
        }),

      TodoActions.destroy
        .map(function({id, promise}) {
          return {
            transform: function (todos) {
              todos = {... todos};
              delete todos[id];
              return todos;
            },
            confirm: promise
          };
        }),

      TodoActions.destroyCompleted
        .map(function ({promise}) {
          return {
            transform: todos =>
              Object.keys(todos).reduce(function (result, id) {
                var todo = todos[id];
                if (!todo.complete) {
                  result[id] = todo;
                }
                return result;
              }, {}),
            confirm: promise
          };
        })
    );
  }
});

module.exports = TodoStore;

var Promise = require('bluebird');

var NAMESPACE = 'rx-flux-todos';


function fakeRemoteCall() {
  return Promise.resolve();
}

module.exports = {
  getTodos() {
    var todos = localStorage.getItem(NAMESPACE);
    return Promise.resolve(todos ? JSON.parse(todos) : {});
  },
  
  init() {
    var TodoStore = require('../stores/todoStore');
    TodoStore.subscribe(
      todos => 
        localStorage.setItem(NAMESPACE, JSON.stringify(todos))
    );
  },
  
  create: fakeRemoteCall,
  updateText: fakeRemoteCall,
  toggleComplete: fakeRemoteCall,
  toggleCompleteAll: fakeRemoteCall,
  destroy: fakeRemoteCall,
  destroyCompleted: fakeRemoteCall,
};
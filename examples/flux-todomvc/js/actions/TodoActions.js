
//var Action = require('rx-flux').Action;
var uuid = require('node-uuid');
var TodoService = require('../services/todoService');

var Footer = require('../components/footer');
var Header = require('../components/header');
var TodoItem = require('../components/todoItem');
var MainSection = require('../components/mainSection');


var TodoActions = {

  /**
   * @param  {string} text
   */
  create: Header.createTodo.map(function(text) {
    var todo = {
      id: uuid.v4(), 
      text, 
      completed: false 
    };
    return {todo, promise: TodoService.create(todo) };
  }),

  /**
   * @param  {id : string, text: string} id The ID of the ToDo item, text the new text
   */
  updateText: TodoItem.updateTodo.map(function ({text, id}) {
    return { text, id, promise: TodoService.updateText(id, text)};  
  }),

  /**
   * Toggle whether a single ToDo is complete
   * @param  {object} todo
   */
  toggleComplete: TodoItem.toggleComplete.map(
    (id) => ({id, promise: TodoService.toggleComplete(id)})
  ),

  /**
   * Mark all ToDos as complete
   */
  toggleCompleteAll: MainSection.toggleCompleteAll.map(
    () => ({promise: TodoService.toggleCompleteAll()})
  ),

  /**
   * @param  {string} id
   */
  destroy: TodoItem.destroyTodo.map(
    (id) => ({id, promise: TodoService.destroy(id)})
  ),

  /**
   * Delete all the completed ToDos
   */
  destroyCompleted: Footer.clearButtonClick.map(
    () => ({promise: TodoService.destroyCompleted()})
  )

};

module.exports = TodoActions;

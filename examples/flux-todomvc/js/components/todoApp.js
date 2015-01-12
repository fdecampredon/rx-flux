var Rx = require('rx');
var React = require('react');
var { StateStreamMixin } = require('rx-react');

var TodoStore = require('../stores/todoStore');
var RouteStore = require('../stores/routeStore');

var Footer = require('./footer');
var Header = require('./header');
var MainSection = require('./mainSection');


var TodoApp = React.createClass({
  mixins: [StateStreamMixin],

  getStateStream: function() {
    return Rx.Observable.combineLatest(
      TodoStore, RouteStore,
      function (todosMap, currentRoute) {
        var todos = Object.keys(todosMap).reduce(function (todoList, id) {
          todoList.push(todosMap[id]);
          return todoList;
        }, []);
        
        var activeTodosCount = todos.reduce(function (accum, todo) {
          return todo.complete ? accum : accum + 1;
        }, 0);
        
        var completeTodosCount = todos.length - activeTodosCount;
        
        return {
          currentRoute,
          todos: todos.filter(
            todo => (
              currentRoute === RouteStore.routes.ALL_TODOS ||
              (todo.complete && currentRoute === RouteStore.routes.COMPLETED_TODOS) ||
              (!todo.complete && currentRoute === RouteStore.routes.ACTIVE_TODOS)
            )
          ),
          areAllComplete: todos.every(todo => todo.complete),
          activeTodosCount, 
          completeTodosCount
        };
      }
    );
  },
  

  /**
   * @return {object}
   */
  render: function() {
    if (!this.state) {
      return null;
    }
    var {
      todos, 
      currentRoute, 
      areAllComplete, 
      activeTodosCount, 
      completeTodosCount
    } = this.state;
    
  	return (
      <div>
        <Header />
        <MainSection 
          todos={todos} areAllComplete={areAllComplete} 
        />
        <Footer 
          currentRoute={currentRoute} 
          activeTodosCount={activeTodosCount}
          completeTodosCount={completeTodosCount}
        />
      </div>
  	);
  },


});

module.exports = TodoApp;

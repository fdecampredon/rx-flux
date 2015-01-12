var React = require('react');
var { EventHandler } = require('rx-react');
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var ReactPropTypes = React.PropTypes;
var TodoItem = require('./todoItem');

var MainSection = React.createClass({
  mixins:[PureRendererMixin],
  
  propTypes: {
    todos: ReactPropTypes.array.isRequired,
    areAllComplete: ReactPropTypes.bool.isRequired
  },
  
  statics: {
    toggleCompleteAll: EventHandler.create()
  },

  getInitialState() {
    return {
      editing: null
    };
  },
  
  onEdit(id) {
    this.setState({editing: id});
  },
  
  onCancel() {
    this.setState({editing: null});
  },
  
  /**
   * @return {object}
   */
  render() {

    var {todos, areAllComplete} = this.props;
    var {editing} = this.state;
    if (!todos || !todos.length) {
      return null;
    }

    return (
      <section id="main">
        <input
          id="toggle-all"
          type="checkbox"
          onChange={MainSection.toggleCompleteAll}
          checked={areAllComplete ? 'checked' : ''}
        />
      
        <label htmlFor="toggle-all">Mark all as complete</label>
        <ul id="todo-list">{
          todos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo}
              onEdit={this.onEdit}
              onSave={this.onCancel}
              onCancel={this.onCancel}
              editing={editing === todo.id} />
          ))
        }</ul>
      </section>
    );
  },


});

module.exports = MainSection;

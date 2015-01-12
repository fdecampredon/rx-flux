var React = require('react');
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var cx = require('react/lib/cx');
var { EventHandler, LifecycleMixin } = require('rx-react');

var ESCAPE_KEY = 27;
var ENTER_KEY = 13;

var TodoItem = React.createClass({
  statics: {
    toggleComplete: EventHandler.create(),
    updateTodo: EventHandler.create(),
    destroyTodo: EventHandler.create()
  },
  
  mixins: [LifecycleMixin, PureRendererMixin],
  
  propTypes: {
    todo: React.PropTypes.object.isRequired,
    editing: React.PropTypes.bool.isRequired,
    onEdit: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired,
    onSave: React.PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      editText: this.props.todo.text
    };
  },
    
  componentWillMount() {
    this.textChange = EventHandler.create();
    this.keyDown = EventHandler.create();
    this.blur = EventHandler.create();
    this.doubleClick = EventHandler.create();
    
    this.textChange.subscribe(event => {
      this.setState({ editText: event.target.value});
    });
    
    
    this.keyDown
    .filter(event => {
      if (event.which === ESCAPE_KEY) {
        this.setState({editText: this.props.todo.text});
        this.props.onCancel();
      } 
      return event.which === ENTER_KEY;
    })
    .merge(this.blur)
    .subscribe(() => {
      var val = this.state.editText.trim();
      var { todo } = this.props;
      if (val) {
        TodoItem.updateTodo({ id: todo.id, text: val});
        this.props.onSave(todo.id);
        this.setState({editText: val});
      } else {
        TodoItem.destroy(todo);
      }
      return false;
    });
        
    this.doubleClick.subscribe(() => {
      var { todo } = this.props;
      this.props.onEdit(todo.id);
      this.setState({editText: todo.text});
    });
        
    this.lifecycle.componentDidUpdate
    .filter((prev) => this.props.editing && !prev.editing)
    .subscribe(() => {
      var node = this.refs.editField.getDOMNode();
      node.focus();
      node.value = this.props.todo.text;
      node.setSelectionRange(node.value.length, node.value.length);
    });
  },
    
    
  render() {
    var {todo, editing } = this.props;
    var {editText} = this.state;
    
    var className = cx({
      completed: todo.complete,
      editing: editing
    });
    
    return (
      <li className={className}>
        <div className="view">
            <input
                className="toggle"
                type="checkbox"
                checked={todo.complete}
                onChange={() => TodoItem.toggleComplete(todo.id)}
            />
            <label className='todoLabel' onDoubleClick={this.doubleClick} >
                {todo.text}
            </label>
            <button className="destroy" onClick={() => TodoItem.destroyTodo(todo.id)} />
        </div>
        <input
            ref="editField"
            className="edit"
            value={editText}
            onChange={this.textChange}
            onBlur={this.blur}
            onKeyDown={this.keyDown}
        />
      </li>
    );
  }

});

module.exports = TodoItem;

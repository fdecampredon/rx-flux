var React = require('react');
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var { EventHandler } = require('rx-react');

var ENTER_KEY = 13;

var Header = React.createClass({
  mixins: [PureRendererMixin],
  
  statics : {
    createTodo: EventHandler.create(),
  },
  
  componentWillMount() {
    this.keyDown = EventHandler.create();
    
    this.keyDown
    .filter(function (event) {
      return event.which === ENTER_KEY;
    })
    .subscribe(function (event) {
      var input = event.target;

      var val = input.value.trim();

      if (val) {
        Header.createTodo(val);
        input.value = '';
      }

      event.preventDefault();
    });
  },
  
  /**
   * @return {object}
   */
  render: function() {
    return (
      <header id="header">
          <h1>todos</h1>
          <input
              ref="newField"
              id="new-todo"
              placeholder="What needs to be done?"
              autoFocus={true}
              onKeyDown={this.keyDown}
          />
      </header>
    );
  }
});

module.exports = Header;

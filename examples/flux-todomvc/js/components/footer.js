var React = require('react');
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');
var { EventHandler } = require('rx-react');

var { routes } = require('../stores/routeStore');
var pluralize = require('../utils/pluralize');
var cx = require('react/lib/cx');




var Footer = React.createClass({
  mixins:[PureRendererMixin],
  
  propTypes: {
    activeTodosCount: React.PropTypes.number.isRequired,
    completeTodosCount: React.PropTypes.number.isRequired,
    currentRoute: React.PropTypes.string.isRequired,
  },
  
  
  statics : {
    clearButtonClick: EventHandler.create(),
  },

  /**
   * @return {object}
   */
  render() {

    var { 
      activeTodosCount , 
      completeTodosCount, 
      currentRoute
    } = this.props;
    
    if (!activeTodosCount && !completeTodosCount) {
      return null;
    }
    
    var clearButton = null;

    if (completeTodosCount > 0) {
      clearButton = (
        <button
          id="clear-completed"
          onClick={Footer.clearButtonClick}>
          Clear completed ({completeTodosCount})
        </button>
      );
    }

    return (
      <footer id="footer">
        <span id="todo-count">
          <strong>{activeTodosCount}</strong> {pluralize(activeTodosCount, 'item')} left
        </span>
        <ul id="filters">
          <li>
            <a href="#/"
              className={cx({selected: currentRoute === routes.ALL_TODOS})}>
              All
            </a>
          </li>
          {' '}
          <li>
            <a href="#/active"
              className={cx({selected: currentRoute === routes.ACTIVE_TODOS})}>
              Active
            </a>
          </li>
          {' '}
          <li>
            <a href="#/completed"
              className={cx({selected: currentRoute === routes.COMPLETED_TODOS})}>
              Completed
            </a>
          </li>
        </ul>
        {clearButton}
      </footer>
    );
  }
});

module.exports = Footer;

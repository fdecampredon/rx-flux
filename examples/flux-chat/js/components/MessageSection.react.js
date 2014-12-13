/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var MessageComposer = require('./MessageComposer.react');
var MessageListItem = require('./MessageListItem.react');
var React = require('react');
var StateStreamMixin = require('rx-react').StateStreamMixin;
var Rx = require('rx');
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');





var MessageSection = React.createClass({

  mixins: [StateStreamMixin, PureRendererMixin],
  
  contextTypes: {
    threadStore: React.PropTypes.object.isRequired,
    messageStore: React.PropTypes.object.isRequired
  },
  
  getStateStream: function() {
    return Rx.Observable.combineLatest(
      this.context.threadStore,
      this.context.messageStore,
      
      
      function (threadData, messages) {
        var threadMessages = [];
        for (var id in messages) {
          if (messages[id].threadID === threadData.currentID) {
            threadMessages.push(messages[id]);
          }
        }
        threadMessages.sort(function(a, b) {
          if (a.date < b.date) {
            return -1;
          } else if (a.date > b.date) {
            return 1;
          }
          return 0;
        });
        return {
          thread: threadData.threads[threadData.currentID],
          messages: threadMessages
        };
      }
    );
  },

  componentDidMount: function() {
    this._scrollToBottom();
  },

  componentDidUpdate: function() {
    this._scrollToBottom();
  },
  
  
  _scrollToBottom: function() {
    var ul = this.refs.messageList.getDOMNode();
    ul.scrollTop = ul.scrollHeight;
  },

  render: function() {
    var messageListItems = this.state.messages.map(function(message) {
      return (
        <MessageListItem
          key={message.id}
          message={message}
        />
      );
    });
    return (
      <div className="message-section">
        <h3 className="message-thread-heading">{this.state.thread && this.state.thread.name}</h3>
        <ul className="message-list" ref="messageList">
          {messageListItems}
        </ul>
        <MessageComposer thread={this.state.thread} />
      </div>
    );
  }


});

module.exports = MessageSection;

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

var React = require('react');
var React = require('react');
var ThreadListItem = require('../components/ThreadListItem.react');
var ChatMessageUtils = require('../utils/ChatMessageUtils');
var StateStreamMixin = require('rx-react').StateStreamMixin;
var PureRendererMixin = require('react/lib/ReactComponentWithPureRenderMixin');


function getUnreadCount(threads) {
  var unreadCount = 0;
  for (var id in threads) {
    if (!threads[id].lastMessage.isRead) {
      unreadCount++;
    }
  }
  return unreadCount;
}

var ThreadSection = React.createClass({
  mixins: [StateStreamMixin, PureRendererMixin],
  
  contextTypes: {
    threadStore: React.PropTypes.object.isRequired
  },
  
  getStateStream: function() {
    return this.context.threadStore.map(function (data) {
      var threads = data.threads;
      return {
        threads: ChatMessageUtils.getAllChrono(threads),
        currentThreadID: data.currentID,
        unreadCount: getUnreadCount(threads)
      };
    });
  },


  render: function() {
    var threadListItems = this.state.threads.map(function(thread) {
      return (
        <ThreadListItem
          key={thread.id}
          thread={thread}
          currentThreadID={this.state.currentThreadID}
        />
      );
    }, this);
    var unread =
      this.state.unreadCount === 0 ?
      null :
      <span>Unread threads: {this.state.unreadCount}</span>;
    return (
      <div className="thread-section">
        <div className="thread-count">
          {unread}
        </div>
        <ul className="thread-list">
          {threadListItems}
          </ul>
      </div>
    );
  }

});

module.exports = ThreadSection;

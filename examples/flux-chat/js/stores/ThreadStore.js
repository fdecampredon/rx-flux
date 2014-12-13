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



var Store = require('rx-flux').Store;
var assign = require('object-assign');
var ChatActions = require('../actions/ChatActions');
var ChatMessageUtils = require('../utils/ChatMessageUtils');



function ThreadStore() {
  Store.call(this);
}

ThreadStore.prototype = Object.create(Store.prototype);

assign(ThreadStore.prototype, {
  constructor: ThreadStore,
  init: function () {
    var store = this;
    this.setValue({
      threads: {},
      currentID: null
    });
    
    store.observe(ChatActions.clickThread, function (threadID) {
      store.applyOperation(function (data) {
        var threads = Object.keys(data.threads).reduce(function (result, id) {
          var thread = data.threads[id];
          if (id === threadID) {
            var lastMessage = assign({}, thread.lastMessage, {isRead : true});
            result[id] = assign({}, thread, {lastMessage: lastMessage});
          } else {
            result[id] = thread;
          }
          return result;
        }, {});
        return {threads: threads, currentID: threadID};
      }, true);
    });
    
    store.observe(ChatActions.receiveRawMessages, function (rawMessages) {
      store.applyOperation(function (data) {
        var threads = assign({}, data.threads);
        var currentID = data.currentID;
        
        rawMessages.forEach(function(message) {
          var threadID = message.threadID;
          var thread = threads[threadID];
          if (thread && thread.lastTimestamp > message.timestamp) {
            return;
          }
          threads[threadID] = {
            id: threadID,
            name: message.threadName,
            lastMessage: ChatMessageUtils.convertRawMessage(message, currentID)
          };
        }, this);

        if (!currentID) {
          var allChrono = ChatMessageUtils.getAllChrono(threads);
          currentID = allChrono[allChrono.length - 1].id;
        }

        threads[currentID].lastMessage.isRead = true;
        
        return {
          threads: threads,
          currentID: currentID
        };
        
      }, true);
    });
  }
});



module.exports = ThreadStore;


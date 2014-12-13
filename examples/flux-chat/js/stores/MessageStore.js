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



function MessageStore(threadStore) {
  Store.call(this);
  this.threadStore = threadStore;
}

MessageStore.prototype = Object.create(Store.prototype);

function markAllInThreadRead(messages, threadID) {
  return Object.keys(messages).reduce(function (result, id) {
    result[id] = messages[id].threadID === threadID ? 
      assign({}, messages[id], {isRead: true}) : 
      messages[id];

    return result;
  }, {});
}


assign(MessageStore.prototype, {
  constructor: MessageStore,
  init: function () {
    
    this.setValue({});
    
    var store = this;
    var threadStore = this.threadStore;
    
    store.observe(
      ChatActions.clickThread
      .waitFor(threadStore, function (action, threadStoreData) {
        return threadStoreData.currentID;
      }),
      
      function (currentID) {
        store.applyOperation(function (messages) {
          return markAllInThreadRead(messages, currentID);
        }, true);
      }
    );
    
    store.observe(
      ChatActions.createMessage, 
      function (action) {
        var message = action.message;
        store.applyOperation(function (messages) {
          var result = assign({}, messages);
          result[message.id] = message;
          return result;
        }, action.promise);
      }
    );
    
    
    store.observe(
      ChatActions.receiveRawMessages
      .waitFor(threadStore, function (rawMessages, threadStoreData) {
        return {
          rawMessages: rawMessages,
          currentID: threadStoreData.currentID
        };
      }),
      function (data) {
        var currentID = data.currentID;
        var rawMessages = data.rawMessages;
        store.applyOperation(function (messages) {
          messages = assign({}, messages);
          rawMessages.forEach(function(message) {
            if (!messages[message.id]) {
              messages[message.id] = ChatMessageUtils.convertRawMessage(
                message,
                currentID
              );
            }
          });
          return markAllInThreadRead(messages, currentID);
        }, true);
      }
    );
  }
});




module.exports = MessageStore;

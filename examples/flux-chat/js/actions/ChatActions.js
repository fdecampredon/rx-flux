var Action = require('rx-flux').Action;
var ChatWebAPIUtils = require('../utils/ChatWebAPIUtils');

var createMessage = Action.create(function(data) {
  var text = data.text;
  var threadID = data.threadID;
  
  var timestamp = Date.now();
  var message = {
    id: 'm_' + timestamp,
    threadID: threadID,
    authorName: 'Bill', // hard coded for the example
    date: new Date(timestamp),
    text: text,
    isRead: true
  };
  var promise = ChatWebAPIUtils.createMessage(message);

  return {
    message: message,
    promise: promise
  };
});
  
var receiveRawMessages = Action.create();
var clickThread = Action.create();


exports.createMessage = createMessage;
exports.receiveRawMessages = receiveRawMessages;
exports.clickThread = clickThread;
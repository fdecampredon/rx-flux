var Rx = require('rx');

function identity(value) {
  return value;
}

function getEnumerablePropertyNames(target) {
    var result = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}

function create(map) {
  map = map || identity;
  var subject = function (value) {
    subject.onNext(value);
  };
  
  
  getEnumerablePropertyNames(Rx.Subject.prototype)
    .forEach(function (property) {
        subject[property] = Rx.Subject.prototype[property];
    });
  
  Rx.Subject.call(subject);
  
  
  subject.onNext = function (value) {
    try {
      Rx.Subject.prototype.onNext.call(subject, map(value));
    } catch(e) {
      subject.onError(e);
    }
  };
  
  subject.onCompleted = function () {
    throw new Error('action should never be complete');
  };
  
  return subject;
}




module.exports = { create: create };
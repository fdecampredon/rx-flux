var Rx = require('rx');


var slice = Array.prototype.slice;


function create(map) {
  var observers = [];
  
  var actionStart = new Rx.Subject();
  var actionEnd = new Rx.Subject();
  
  var action = function (value) {
    if (typeof map !== 'undefined') {
      if (typeof map === 'function') {
        value = map(value);
      } else {
        value = map;
      }
    } 
    
    actionStart.onNext(value);
    var os = observers.slice(0);
    for (var i = 0, len = os.length; i < len; i++) {
        os[i].onNext(value);
    }
    actionEnd.onNext();
    
    return value;
  };
  
  for (var key in Rx.Observable.prototype) {
    action[key] = Rx.Subject.prototype[key];
  }
  

  
  Rx.Observable.call(action, function (observer) {
      observers.push(observer);
      return {
        dispose: function () {
          var index = observers.indexOf(observer);
          if (index !== -1) {
            observers.splice(index, 1);
          }
        }
      };
  });
  
  action.hasObservers  = function () {
    return observers.length > 0 || actionStart.hasObservers() || actionEnd.hasObservers();
  };
  
  action.waitFor = function (observables) {
    observables = slice.call(arguments);
    return actionStart
      .flatMap(function (value) {
        return Rx.Observable.combineLatest(
          observables.map(function (observable) {
            observable =  observable.takeUntil(actionEnd).publish();
            observable.connect();
            return observable;
          }),
          function () {
            return value;
          }
        );
      });
  };
  
  
  return action;
}




module.exports = { create: create };
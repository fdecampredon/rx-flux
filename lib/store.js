
var Rx   = require('rx');
var uuid = require('node-uuid');
var invariant = require('./invariant');

function isPromise(promise) {
  return promise && typeof promise.then === 'function';
}

function isObservable(observable) {
  return observable && typeof observable.subscribe === 'function';
}

function create(spec) {
  invariant(
    spec && typeof spec === 'object', 
    'Store.create(...): expect an object as argument, given : %s', spec
  );
  
  invariant(
    spec.getInitialValue && typeof spec.getInitialValue === 'function', 
    'Store.create(...): getInitialValue should be a function given : %s', spec.getInitialValue
  );
  

  invariant(
    !spec.getOperations || typeof spec.getOperations === 'function', 
    'Store.create(...): getOperations should be a function given : %s', spec.getOperations
  );
  
  
  var getInitialValue = spec.getInitialValue;
  var getOperations = spec.getOperations;
  
  //State
  var value = null;
  var observers = Object.create(null);
  var operationsMap = Object.create(null);
  var operationsStack = [];
  var valueSubscription = null;
  var operationSubscription = null;
  var isPending = true;
  
  function hasObservers() {
    return !!Object.keys(observers).length;
  }
  
  
  function notifyObservers(error) {
    Object.keys(observers).forEach(function (uid) {
      if (error) {
        return observers[uid].onError(error);
      } else {
        observers[uid].onNext(value);
      }
    });
  }
  
  function init() {
    var initialValue = getInitialValue();
    if (isPromise(initialValue)) {
      initialValue.then(setValue, notifyObservers);
    } else if (isObservable(initialValue)) {
      valueSubscription = initialValue.subscribe(setValue, notifyObservers);
    } else {
      setValue(initialValue);
    }
  }
  
  function setValue(val) {
    value = val;
    isPending = false;
    initOperations();
    notifyObservers();
  }
  
  function disposeOperations() {
    if (operationSubscription) {
      operationSubscription.dispose();
    }
    
    operationSubscription = null;
    operationsMap = Object.create(null);
    operationsStack = [];
  }
  
  function initOperations() {
    disposeOperations();

    if (getOperations) {
      var operations = getOperations();
      if (!isObservable(operations)) {
        throw new TypeError('getOperations(): should return an observable, given : ' + operations);
      }
      operationSubscription = operations.subscribe(operationObservers);
    }
  }
  
  function dispose() {
    if (valueSubscription) {
      valueSubscription.dispose();
    }
    disposeOperations();
    value = null;
    valueSubscription = null;
    isPending = true;
  }

  function cancelOperation(uid) {
    if (!operationsMap[uid]) {
        return;
    }

    var oldValue = operationsMap[uid].oldValue;
    var index = operationsStack.indexOf(uid);

    value = operationsStack.slice(index + 1).reduce(function (value, uid) {
        var descriptor = operationsMap[uid];
        descriptor.oldValue = value;
        return applyOperation(value, descriptor.operation);
    }, oldValue);

    operationsStack.splice(index, 1);
    delete operationsMap[uid];
    notifyObservers();
  }

  function confirmOperation(uid) {
    if (!operationsMap[uid]) {
        return;
    }
    operationsMap[uid].confirmed = true;
    var lastIndex = -1;
    operationsStack.every(function (uid, index) {
        if (operationsMap[uid].confirmed) {
            delete operationsMap[uid];
            lastIndex = index;
            return true;
        }
    });

    operationsStack = operationsStack.slice(lastIndex + 1);
  }

  function operationObservers(operation) {
    invariant(
      operation && typeof operation === 'object',
      'invalid operation, operations should be an object, given : %s', operation
    );
    
    invariant(
      operation.value || 
      (
        operation.transform && 
        typeof operation.transform === 'function'
      ),
      'invalid operation, operations should have a value or a transform property'
    );

    
    var oldValue = value;
    value = applyOperation(value, operation);
    notifyObservers();


    var uid = uuid.v1();
    operationsMap[uid] = {
      operation: operation,
      oldValue: oldValue
    };
    operationsStack.push(uid);

    if ('confirm' in operation) {
      invariant(
        isPromise(operation.confirm),
        'invalid operation, confirm should be a promise, given : %s', operation.confirm
      );
      
      operation.confirm.then(function () { 
        confirmOperation(uid);
      }, function () { 
        cancelOperation(uid); 
      });
    } else {
      confirmOperation(uid);
    }
  }


  function applyOperation(value, operation) {
    return 'value' in operation ? 
      operation.value : 
      operation.transform(value);
  }
  
  
  function subscribe(observer) {

    var uid = uuid.v1();

    if (!hasObservers()) {
      init();
    }

    observers[uid] = observer;

    if (!isPending) {
      observer.onNext(value);
    }

    return Rx.Disposable.create(function () {
      delete observers[uid];
      if (!hasObservers()) {
        dispose();
      }
    });
  }
  
  return Rx.Observable.create(subscribe);
}

module.exports = {
  create: create
};


var Rx   = require('rx');
var uuid = require('node-uuid');



function Store(value) {
  this._observers = Object.create(null);
  this._operationsMap = Object.create(null);
  this._operationsStack = [];
  this._initSubject = new Rx.Subject();
  this._disposeSubject = new Rx.Subject();
  
  this.value = value;
  this.lifecycle = {
    init: this._initSubject.asObservable(),
    dispose: this._disposeSubject.asObservable(),
  };
  
  Rx.Observable.call(this, subscribe);
}

Store.prototype = Object.create(Rx.Observable.prototype);    



    
function subscribe(observer) {
  
  var store = this;
  var uid = uuid.v1();
  var observers = store._observers;
  
  if (!hasObservers(store)) {
    store._initSubject.onNext();
  }
  
  observers[uid] = observer;
  
  if (!store.isPending) {
    observer.onNext(this.value);
  }
  
  return Rx.Disposable.create(function () {
    delete observers[uid];
    if (!hasObservers(store)) {
      store._disposeSubject.onNext();
    }
  });
}

function hasObservers(store) {
  return !!Object.keys(store._observers).length;
}


function operationAlreadyConfirmdOrCanceled() {
  throw new Error('the operation has already been confirmed or canceled');
}

function notifyObservers(store, error) {
  var observers = store._observers;
  var value = store.value;
  Object.keys(observers).forEach(function (uid) {
    if (error) {
      return observers[uid].onError(error);
    }
    observers[uid].onNext(value);
  });
}


function cancelOperation(store, uid) {
  
  var operationsMap = store._operationsMap;
  var operationsStack = store._operationsStack;
  
  if (!operationsMap[uid]) {
      operationAlreadyConfirmdOrCanceled();
  }

  var oldValue = operationsMap[uid].oldValue;
  var index = operationsStack.indexOf(uid);

  store.value = operationsStack.slice(index + 1).reduce(function (value, uid) {
      var descriptor = operationsMap[uid];
      return  descriptor.operation(value);
  }, oldValue);

  operationsStack.splice(index, 1);
  delete operationsMap[uid];
  notifyObservers(store);
}

function confirmOperation(store, uid) {
  var operationsMap = store._operationsMap;
  var operationsStack = store._operationsStack;
  
  if (!operationsMap[uid]) {
      operationAlreadyConfirmdOrCanceled();
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

  store._operationsStack = operationsStack.slice(lastIndex + 1);
}



Store.prototype.applyOperation =  function (operation, confirm) {
  
  var oldValue = this.value;
  var operationsMap = this._operationsMap;
  var operationsStack = this._operationsStack;
  var store = this;
  
  this.value = operation(oldValue);
  notifyObservers(store);
  

  var uid = uuid.v1();
  operationsMap[uid] = {
    operation: operation,
    oldValue: oldValue
  };
  operationsStack.push(uid);
  
  if (!confirm) {
    return {
      cancel: function () { 
        cancelOperation(store, uid); 
      },
      confirm: function () { 
        confirmOperation(store, uid);
      }
      };
  } else {
    if (confirm === true) {
      confirmOperation(store, uid);
      return { 
        cancel: operationAlreadyConfirmdOrCanceled,
        confirm: operationAlreadyConfirmdOrCanceled
      };
    } else {
      confirm.then(function () { 
        confirmOperation(store, uid);
      }, function () { 
        cancelOperation(store, uid); 
      });
    }
  }
};

Store.prototype.getValue= function () {
  return this.value;
};


Store.prototype.setValue= function (val) {
  if (!Rx.helpers.isPromise(val)) {
    this.isPending = false;
    this.value = val;
    this._operationsMap = Object.create(null);
    this._operationsStack = [];
    notifyObservers(this);
  } else {
    this.isPending = true;
    val.then(this.setValue.bind(this));
  }
};


module.exports = Store;


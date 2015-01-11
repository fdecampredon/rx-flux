var test     = require('tape');
var Store    = require('../lib/store');
var Rx       = require('rx');
var sinon    = require('sinon');
var Promise  = require('bluebird/zalgo');


test('Store', function (t) {
  t.test('errors', function () {
    t.throws(
      function () {
        Store.create(5);
      }, 
      /Invariant Violation: Store.create\(\.\.\.\): expect an object as argument, given : 5/,
      'it should throw an error if argument passed to Store.create is not an object'
    );
    
    t.throws(
      function () {
        Store.create({});
      }, 
      /Invariant Violation: Store.create\(\.\.\.\): getInitialValue should be a function given : undefined/,
      'it should throw an error if getInitialValue is not defined'
    );
    
    t.throws(
      function () {
        Store.create({
          getInitialValue: true
        });
      }, 
      /Invariant Violation: Store.create\(\.\.\.\): getInitialValue should be a function given : true/,
      'it should throw an error if getInitialValue is not a function '
    );
    
    t.throws(
      function () {
        Store.create({
          getInitialValue: function () {},
          getOperations: {}
        });
      }, 
      /Invariant Violation: Store.create\(\.\.\.\): getOperations should be a function given : \[object Object\]/,
      'it should throw an error if getOperations is not a function '
    );
    
    t.end();
  });
  
  t.test('behavior', function (t) {
    t.plan(4);
    
    var value = {};
    var store = Store.create({
      getInitialValue: function () {
        return value;
      }
    });
    
    t.ok(store instanceof Rx.Observable, 'it should produce an Rx Observable');
    
    store.subscribe(function (val) {
      t.equals(
        val, value, 
        'if getInitialValue does not returns a promise nor an observable, ' + 
        'the store should publish the value returned by getInitialValue'
      );
    });
    
    
    store = Store.create({
      getInitialValue: function () {
        return Promise.resolve(value);
      }
    });
    
    store.subscribe(function (val) {
      t.equals(
        val, value, 
        'if getInitialValue returns a promise the store should publish the promise resolve value'
      );
    });
    
    store = Store.create({
      getInitialValue: function () {
        return Rx.Observable.of(value);
      }
    });
    
    store.subscribe(function (val) {
      t.equals(
        val, value, 
        'if getInitialValue returns an observable the store should publish the observable resolve value'
      );
    });
  });
  
  t.test('operations', function (t) {
    t.test('erros', function () {
      t.throws(
        function () {
          var store = Store.create({
            getInitialValue: function () {
              return {};
            },
            getOperations: function () {
              return Rx.Observable.of(5);
            }
          });
          store.subscribe(function () {});
        }, 
        /Invariant Violation: invalid operation, operations should be an object, given : 5/,
        'it should throw an error if getInitialValue is not a function '
      );
      
      t.throws(
        function () {
          var store = Store.create({
            getInitialValue: function () {
              return {};
            },
            getOperations: function () {
              return Rx.Observable.of({});
            }
          });
          store.subscribe(function () {});
        }, 
        /Invariant Violation: invalid operation, operations should have a value or a transform property/,
        'it should throw an error if getInitialValue is not a function '
      );
      
      t.end();
    });
    
    t.test('basic transform operation', function (t) {
      t.plan(3);
      
      var value = { hello: 'world' };
      var newValue = { foo: 'bar' };
      var operations = new Rx.Subject();
      var store = Store.create({
        getInitialValue: function () {
          return value;
        },
        
        getOperations: function () {
          return operations;
        }
      });
      
      var spy = sinon.spy();

      store.subscribe(spy);

      operations.onNext({
        transform: function (val) { 
          t.deepEqual(val, value, 'the value held by the store should be passed to the function operation');
          return newValue; 
        }
      });

      t.equal(spy.getCall(0).args[0], value, 'the value held by the store ' + 
                  'should be the one returned by the function passed to \'applyOperation\'');

      t.equal(spy.getCall(1).args[0], newValue, 'observers should have been notified with the new value');
    });
    
    t.test('basic set value operation', function (t) {
      var value = { hello: 'world' };
      var newValue = { foo: 'bar' };
      var operations = new Rx.Subject();
      var store = Store.create({
        getInitialValue: function () {
          return value;
        },
        
        getOperations: function () {
          return operations;
        }
      });
      
      var spy = sinon.spy();


      store.subscribe(spy);

      operations.onNext({ value: newValue });

      t.equal(spy.getCall(0).args[0], value, 'the value held by the store ' + 
                  'should be the one returned by the function passed to \'applyOperation\'');

      t.equal(spy.getCall(1).args[0], newValue, 'observers should have been notified with the new value');
      
      t.end();
    });
    
    t.test('operations canceling', function (t) {
      
      t.test('basic', function (t) {
        var value = {};
        var newValue = {};
        var operations = new Rx.Subject();
        var store = Store.create({
          getInitialValue: function() {
            return value;
          },
          getOperations: function() {
            return operations;
          }
        });
        
        var spy = sinon.spy();


        store.subscribe(spy);

        operations.onNext({
          value: newValue,
          confirm: Promise.reject()
        });


        t.equal(spy.getCall(0).args[0], value, 'observers should have been notified with the initial value');
        t.equal(spy.getCall(1).args[0], newValue, 'observers should have been notified with the new value');
        t.equal(spy.getCall(2).args[0], value, 'observers should have been notified about the canceling');
        t.end();
      });
        
        
      function deferred() {
        var result = {};
        result.promise =  new Promise(function (resolve, reject) {
          result.resolve = resolve;
          result.reject = reject;
        });
        return result;
      }
      t.test('nesting', function (t) {
        var operations = new Rx.Subject();
        var store = Store.create({
          getInitialValue: function() {
            return [];
          },
          getOperations: function() {
            return operations;
          }
        });

        var spy = sinon.spy();
        store.subscribe(spy);

        t.deepEqual(spy.getCall(0).args[0], [], 'observers should have been notified with the initial value');
          
        var deferred1 = deferred();
        operations.onNext({
          transform: function (arr) {
            return arr.concat('foo');
          },
          confirm: deferred1.promise
        });
        t.deepEqual(
            spy.getCall(1).args[0], ['foo'], 
            'observers should have been notified with the transformed value after that the first operation have been applied'
        );
          
        var deferred2 = deferred();   
        operations.onNext({
          transform: function (arr) {
            return arr.concat('bar');
          },
          confirm: deferred2.promise
        });
        t.deepEqual(
            spy.getCall(2).args[0], ['foo','bar'], 
            'observers should have been notified with the transformed value after that the second operation have been applied'
        );
          
        deferred1.reject();
        t.deepEqual(
            spy.getCall(3).args[0], ['bar'], 
            'observers should have been notified with result of applying the ' +
            'second operation on the old value after that the first operation has failed'
        );
          
        deferred2.reject();
        t.deepEqual(
            spy.getCall(4).args[0], [], 
            'observers should have been notified with the initial value after that the second operation has failed'
        );
        
        t.end();
      });
    });
    
//    
//    
//
    
//
//
//        t.test('already canceled/confirmed operation', function (t) {
//          var store = new Store([]);
//          
//          var operation1 = store.applyOperation(function (arr) {
//            return arr.concat('foo');
//          });
//          operation1.cancel();
//          
//          var operation2 = store.applyOperation(function (arr) {
//            return arr.concat('foo');
//          });
//          operation2.confirm();
//
//          t.plan(4);
//
//          t.throws(function () {
//              operation1.cancel();
//          }, 'an operation already canceled shoul throw an error when canceled again');
//
//
//          t.throws(function () {
//              operation1.confirm();
//          }, 'an operation already canceled shoul throw an error when confirmed');
//
//
//          t.throws(function () {
//              operation2.cancel();
//          }, 'an operation already confirmed shoul throw an error when canceled again');
//
//
//          t.throws(function () {
//              operation2.confirm();
//          }, 'an operation already confirmed shoul throw an error when confirmed');
//        });
//    });
//    
//    t.test('lifecycle', function (t) {
//      var store = new Store([]);
//      t.plan(6);
//      
//      t.ok(store.lifecycle.init instanceof Rx.Observable, 'it should expose an init lifecycle observable');
//      t.ok(store.lifecycle.dispose instanceof Rx.Observable, 'it should expose an dispose lifecycle observable');
//      
//      var initSpy = sinon.spy();
//      
//      store.lifecycle.init.subscribe(initSpy);
//      
//      var subscription1 = store.subscribe(function () {});
//      t.ok(initSpy.calledOnce, 'the init lifecycle should notify on first subscription');
//      var subscription2 = store.subscribe(function () {});
//      t.ok(initSpy.calledOnce, 'the init lifecycle should notify on first subscription');
//      
//      
//      var disposeSpy = sinon.spy();
//      store.lifecycle.dispose.subscribe(disposeSpy);
//      subscription1.dispose();
//      t.ok(disposeSpy.notCalled, 'the dispose lifecycle should not be called while the store has active subscription');
//      subscription2.dispose();
//      t.ok(disposeSpy.calledOnce, 'the dispose lifecycle should be called after the last subscription has been disposed');
//      
//    });
  });
});

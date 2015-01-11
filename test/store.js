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
    
    t.test('lifecycle', function (t) {
      
      var initialValue = new Rx.Subject();
      var initialValueSpy = sinon.spy(function () {
        return initialValue;
      });
      
      var operations = new Rx.Subject();
      var operationsSpy = sinon.spy(function () {
        return operations;
      });
      var store = Store.create({
        getInitialValue: initialValueSpy,
        getOperations: operationsSpy
      });
      
      t.ok(
        !initialValueSpy.called && !operationsSpy.called, 
        'before subscription getInitialValue and getOperatons should not have been called'
      );
      
      var disposable = store.subscribe(function() {});
      
      t.ok(
        initialValueSpy.called && initialValue.hasObservers(),
        'on the first subscription the store should get the initialValue and subscribe to the returned obserbvable'
      );
      
      t.ok(
        !operationsSpy.called, 
        'until initialValue observable push a new value getOperations should not have been called'
      );
      
      initialValue.onNext({});
      
      t.ok(
        operationsSpy.called && operations.hasObservers(), 
        'when the initialValue resolve to a value operations spy should have been called '
      );
      
      var oldOperations = operations;
      operations = new Rx.Subject();
      
      initialValue.onNext({});
      
      t.ok(
        operationsSpy.calledTwice && operations.hasObservers() && !oldOperations.hasObservers(), 
        'when the initialValue push a newvalue the store shoul dispose the subscription to operations, ' +
        'reinvoke getOperations and subscribe to the returned observable'
      );
      
      disposable.dispose();
      
      t.ok(
        !initialValue.hasObservers() && !operations.hasObservers(),
        'when all the subscription to the store has been disposed, it should dispose the subscription on ' + 
        'operations and initialValue'
      );
      
      store.subscribe(function () {});
      
      t.ok(
        initialValueSpy.calledTwice && initialValue.hasObservers() &&
        operationsSpy.calledTwice && !operations.hasObservers(),
        'on resubscribe it should restart the process'
      );
      
      initialValue.onNext({});
      
      t.ok(
        operationsSpy.calledThrice  && operations.hasObservers(),
        'on resubscribe it should restart the process'
      );
      
      t.end();
    });
  });
});

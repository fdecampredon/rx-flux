var test     = require('tape');
var Store    = require('../lib/store');
var Rx       = require('rx');
var sinon    = require('sinon');


test('Store', function (t) {
  t.test('construtor', function (t) {
      
    t.plan(2);
    var value = {};
    var store = new Store(value);

    t.ok(store instanceof Rx.Observable, 'it should produce an Rx Observable');
    store.subscribe(function (val) {
      t.equal(val, value, 'the value of the observer should be the value passed to constructor if that value is not a function'); 
    });
        
  });
  
  t.test('applyOperation', function (t) {
    t.test('basic', function (t) {
      var value = { hello: 'world' };
      var newValue = { foo: 'bar' };
      var store = new Store(value);
      var spy = sinon.spy();

      t.plan(3);

      store.subscribe(spy);

      store.applyOperation(function (val) { 
          t.deepEqual(val, value, 'the value held by the store should be passed to the function operation');
          return newValue; 
      }, true);


      t.equal(store.value, newValue, 'the value held by the store ' + 
                  'should be the one returned by the function passed to \'applyOperation\'');

      t.equal(spy.getCall(1).args[0], newValue, 'observers should have been notified with the new value');
      console.log(spy.calls);
    });

    t.test('operations canceling', function (t) {
        t.test('basic', function (t) {
          var value = {};
          var newValue = {};
          var store = new Store(value);
          var spy = sinon.spy();

          t.plan(3);

          store.subscribe(spy);

          var operation = store.applyOperation(function () {
              return newValue;
          });

          operation.cancel();

          t.deepEqual(store.value, value, 'the value held by the store ' + 
                      'should be the one before the operation as applied');

          t.equal(spy.getCall(1).args[0], newValue, 'observers should have been notified with the new value');
          t.equal(spy.getCall(2).args[0], value, 'observers should have been notified about the canceling');
        });

        t.test('nesting', function (t) {
          var store = new Store([]);
          var operationSpy = sinon.spy(function (arr) {
              return arr.concat('bar');
          });

          t.plan(2);

          var operation = store.applyOperation(function (arr) {
            return arr.concat('foo');
          });
          
          store.applyOperation(operationSpy, true);

          operation.cancel();

          t.equal(operationSpy.callCount, 2, 'the operation should have been applied 2 times');
          t.deepEqual(store.value, ['bar'], 'the value held by the store should be the result of ' + 
                      'applying the second operation on the old value');

        });


        t.test('already canceled/confirmed operation', function (t) {
          var store = new Store([]);
          
          var operation1 = store.applyOperation(function (arr) {
            return arr.concat('foo');
          });
          operation1.cancel();
          
          var operation2 = store.applyOperation(function (arr) {
            return arr.concat('foo');
          });
          operation2.confirm();

          t.plan(4);

          t.throws(function () {
              operation1.cancel();
          }, 'an operation already canceled shoul throw an error when canceled again');


          t.throws(function () {
              operation1.confirm();
          }, 'an operation already canceled shoul throw an error when confirmed');


          t.throws(function () {
              operation2.cancel();
          }, 'an operation already confirmed shoul throw an error when canceled again');


          t.throws(function () {
              operation2.confirm();
          }, 'an operation already confirmed shoul throw an error when confirmed');
        });
    });
    
    t.test('lifecycle', function (t) {
      var store = new Store([]);
      t.plan(6);
      
      t.ok(store.lifecycle.init instanceof Rx.Observable, 'it should expose an init lifecycle observable');
      t.ok(store.lifecycle.dispose instanceof Rx.Observable, 'it should expose an dispose lifecycle observable');
      
      var initSpy = sinon.spy();
      
      store.lifecycle.init.subscribe(initSpy);
      
      var subscription1 = store.subscribe(function () {});
      t.ok(initSpy.calledOnce, 'the init lifecycle should notify on first subscription');
      var subscription2 = store.subscribe(function () {});
      t.ok(initSpy.calledOnce, 'the init lifecycle should notify on first subscription');
      
      
      var disposeSpy = sinon.spy();
      store.lifecycle.dispose.subscribe(disposeSpy);
      subscription1.dispose();
      t.ok(disposeSpy.notCalled, 'the dispose lifecycle should not be called while the store has active subscription');
      subscription2.dispose();
      t.ok(disposeSpy.calledOnce, 'the dispose lifecycle should be called after the last subscription has been disposed');
      
    });
  });
});

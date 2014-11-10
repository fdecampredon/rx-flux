var Action = require('../lib/action');
var test   = require('tape');

test('Action', function (t) {
  t.test('create', function (t) {
    var action = Action.create();
    t.plan(1);
    t.ok(typeof action === 'function', 'it should be a function');  
  });
  
  t.test('call', function (t) {
    var action = Action.create();
    t.plan(1);

    action.subscribe(function (val) {
      t.equals(3, val, 'it should notify passed value to subscribed observer when called');
    });

    action(3);
  });
  
  
  t.test('onNext', function (t) {
    var action = Action.create();
    t.plan(1);

    action.subscribe(function (val) {
      t.equals(3, val, 'it should notify passed value to subscribed observer when used as a subject');
    });

    action.onNext(3);
  });
  
  
  t.test('onCompleted', function (t) {
    var action = Action.create();
    t.plan(1);

    t.throws(function () {
      action.onCompleted();
    }, /action should never be complete/, 'it should throw an error when calling onCompleted');
  });
  
  
  t.test('map', function (t) {
    var value1 = {}, value2 = {};
    
    
    t.plan(6);
    var action = Action.create(function (val) {
      t.equal(val, value1, 'it should pass the value passed as parameter to the map function');
      return value2;
    });
    
    action.subscribe(function (val) {
      t.equals(value2, val, 'it should pass the result of the map function to observers');
    });
    
    action(value1);
    action.onNext(value1);
    
    action = Action.create(function (val) {
      t.equal(val, value1, 'map function should be called even if the action has no subscription');
    });
    action(value1);
    
    
    var error = new Error();
    action = Action.create(function () {
      throw error;
    });
  
    action.subscribe(function() {}, function (err) { 
      t.equals(error, err, 'it should pass the function has onError if the map function throw an error'); 
    });
    
    action();
  });
  
});
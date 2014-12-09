var Action = require('../lib/action');
var Rx     = require('rx');
var test   = require('tape');

test('Action', function (t) {
  t.test('create', function (t) {
    var action = Action.create();
    t.ok(typeof action === 'function', 'it should be a function'); 
    
    t.end();
  });
  
  t.test('call', function (t) {
    t.plan(2);

    var action = Action.create();
    action.subscribe(function (val) {
      t.equals(3, val, 'it should notify passed value to subscribed observer when called');
    });
    
    action.subscribe(function (val) {
      t.equals(3, val, 'it should notify passed value to subscribed observer when called');
    });

    action(3);
  });
  
  
  
  
  t.test('map', function (t) {
    t.plan(5);
    
    var value1 = {}, value2 = {};
    var action = Action.create(function (val) {
      t.equal(val, value1, 'it should pass the value passed as parameter to the map function');
      return value2;
    });
    
    action.subscribe(function (val) {
      t.equals(value2, val, 'it should pass the result of the map function to observers');
    });
    
    t.equals(action(value1), value2, 'it should returns the value returned by map');
    
    action = Action.create(function (val) {
      t.equals(val, value1, 'map function should be called even if the action has no subscription');
    });
    action(value1);
    
    
    var error = new Error();
    action = Action.create(function () {
      throw error;
    });
  
    t.throws(action, 'it should throw an error when an error is thrown in the map');
 
    
  });
  
  
  t.test('disposal', function (t) {
    t.plan(1);
    
    var action = Action.create();
    
    action.subscribe(function () { 
      t.fail('it should not call observer that has been disposed');
    }).dispose();
    
    action.subscribe(function () { 
      t.ok(true, 'it should call observer that has not been disposed');
    });
    
    action.subscribe(function () { 
      t.fail('it should not call observer that has been disposed');
    }).dispose();
    
    action(3);
   
  });
  
  
  t.test('hasObservers', function (t) {
    var action = Action.create();
    
    t.false(action.hasObservers(), 'it should returns true if the action has observers');
    
    var disposable = action.subscribe(function () {  });
    t.true(action.hasObservers(), 'it should returns true if the action has observers');
    
    disposable.dispose();
    t.false(action.hasObservers(), 'it should returns false if all the subscriptions have been disposed');
    
    t.end();
  });
  
  
  t.test('waitFor', function (t) {
    
    
    t.test('observations registring', function (t) {
      var action = Action.create();
      var subject1 = new Rx.Subject();
      var subject2 = new Rx.BehaviorSubject(10);
      var waitForObservable = action.waitFor(subject1, subject2);
      
      t.false(action.hasObservers() || subject1.hasObservers() || subject2.hasObservers(), 
              'action and observables passed to waitFor should not have any observer registred until the observable returned by waitFor has been subscribed');


      var disposable = waitForObservable.subscribe(function () {});

      t.true(action.hasObservers(), 
             'action should have a registred observer when the observable returned by waitFor has been subscribed');
      t.false(subject1.hasObservers() || subject2.hasObservers(), 
              'observables  passed to waitFor should have not have any observer registred when the observable returned by waitFor has been subscribed');

      disposable.dispose();

      t.false(action.hasObservers(), 
             'action should not have a registred observer when the subscription over the observable returned waitFor has been disposed');
      t.end();
    });
    
    
    t.test('notification order without waitFor', function (t) {
      t.plan(4);
      
      var action = Action.create();
      var subject1 = new Rx.Subject();
      var subject2 = new Rx.BehaviorSubject(10);
      var called = 0;
      
      action.subscribe(function () {
        t.false(subject1.hasObservers() || subject2.hasObservers(), 'without waitFor both observables should have not registred observer');
        t.false(called > 0, 'without waitFor notification should be done in order of subscriptiuon');
        subject1.onNext();
      });

      action.subscribe(function () {
        called++;
      });

      action.subscribe(function () {
        t.false(subject1.hasObservers() || subject2.hasObservers(), 'without waitFor both observables should have not registred observer');
        t.equals(called, 1, 'without waitFor notification should be done in order of subscriptiuon');
        subject2.onNext(11);
      });
      
      action();
      
    });
    
    
    t.test('notification order with waitFor', function (t) {
      t.plan(13);
      
      var action = Action.create();
      var subject1 = new Rx.Subject();
      var subject2 = new Rx.BehaviorSubject(10);
      var called = 0, value = {}, disposable, disposables = [];

      disposable = action.subscribe(function () {
        t.true(subject1.hasObservers() && subject2.hasObservers(), 
              'observables  passed to waitFor should have observer registred during the action `dispatching`');
        t.false(called > 0, 'the observable returned by waitFor should not have been notified until observables passed to waitFor has notified a new value');
        subject1.onNext();
      });
      disposables.push(disposable);

      disposable = action.waitFor(subject1, subject2).subscribe(function (val) {
        called++;
        t.equals(val, value, 'the observable returned by waitFor should pass the value passed to the action');
      });
      disposables.push(disposable);

      disposable = action.subscribe(function () {
        t.true(subject1.hasObservers() && subject2.hasObservers(), 
              'observables  passed to waitFor should have observer registred during the action `dispatching`');
        t.false(called > 0, 'the observable returned by waitFor should not have been notified until observables passed to waitFor has notified a new value');
        subject2.onNext(11);
      });
      disposables.push(disposable);


      action(value);
      t.false(subject1.hasObservers() || subject2.hasObservers(), 
              'observables  passed to waitFor should not have any observer after subscriptions');
      t.equals(called, 1, 'the observer returned by waitFor should notify only one time');

      called = 0;
      subject2.onNext(12);
      action(value);

      disposables.forEach(function (disposable) {
        disposable.dispose();
      });


      t.false(action.hasObservers(), 
             'action should not have a registred observer when the subscription over the observable returned waitFor has been disposed');
      
    });
  });
  
});
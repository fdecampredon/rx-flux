RxFlux
=======

> A [Flux](https://github.com/facebook/flux/) architecture implementation based on [RxJS](https://github.com/Reactive-Extensions/RxJS)

The [Flux](https://github.com/facebook/flux/) architecture allows you to think your application as an unidirectional flow of data, this module aims to facilitate the use of [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) as basis for defining the relations between the different entities composing your application.

Instalation
-----------
RxFlux can be retrieved as an npm package :
```
npm install rx-flux
```


Difference with the Original Flux 
---------------------------------

RxFlux shares more similarities with [RefluxJS](https://github.com/spoike/refluxjs) than with the original architecture.

* A store is an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) that *holds* a value
* An action is a function and an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md)
* A store subscribes to an action and update accordingly its value.
* There is no central dispatcher.

Store
-----

###Usage

A `Store` is an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) :
```javascript
var Store = require('rx-flux').Store;

class MyStore extends Store {
  constructor(value) {
    super();
    this.setValue(value);
  }
};

var myStore = new MyStore(['foo', 'bar']);
console.log(myStore.getValue()); // ['foo', 'bar']

myStore.subscribe(function (value) {
  console.log(value); // ['foo', 'bar']
});
```

It also exposes a method `applyOperation`, this method allows to apply a transformation over the value held by the store:
```javascript
var myStore = new MyStore(['foo']);

myStore.applyOperation(function (value) {
  return value.concat('bar');
});

console.log(myStore.getValue()); // ['foo', 'bar']
```

Operations can be canceled or confirmed :
```javascript
var myStore = new MyStore([]);

var operation1 = myStore.applyOperation(function (value) {
  return value.concat('foo');
});

var operation2 = myStore.applyOperation(function (value) {
  return value.concat('bar');
});

console.log(myStore.getValue()); // ['foo', 'bar']

operation2.confirm();

console.log(myStore.getValue()); // ['foo', 'bar']

operation1.cancel();

console.log(myStore.getValue()); // ['bar']

```
This mechanism offers the possibility to revert the state of your application in case of failed server request, or to implements an undo/redo system.


> There is 3 important rules to respect when you are using the operation system: 
* **In an operation, never directly mutate the store value, but return a new object.**
* **You need to confirm operations at some point to allow the store to free the internal history object, if you don't you are at risk of facing serious memory leak issues.**
* **Finally operations can be executed multiple times, so they should never have side-effect.**


###Api

The `Store` *class* inherits from [`Rx.Observable`](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md), it also exposes the following methods:

* `getValue(): any` : returns the value held by the store.

* `setValue(value: any | Promise): void` : set the value held by the store.  
If you pass a `Promise` to this method the value will be set to whatever the promise resolve to, 
also the store will pass in a *pending* state and won't publish any value until the promise is resolved.  
**this method will overwritte operations history**.

* `applyOperation(operation: (value: any) => any): { confirm: () => void, cancel: () }` :
this method takes has parameter a function that should implements a transformation over the store value.
it returns an object with 2 methods `confirm` and `cancel` used to respectively 
to confirm or cancel the operation.  

* `applyOperation(operation: (value: any) => any, true): void` : this overload allows to directly confirm the operation, equivalent of `applyOperation(...).confirm()`

* `applyOperation(operation: (value: any) => any, promise: Promise): void` : if you pass a promise as the second argument of `applyOperation` the operation will be confirmed or canceled when that promise is resolved or rejected.

* `observe(observable: Rx.Observable<T>, handler: (val: t) => void): void`: a shortcut for `observable.subscribe(handler)`, however the resulting subscription will be automatically disposed on store disposal.

You can also implements two *lifecycle* methods when *subclassing* the `Store`:
* `init(): void`: this method will be called the first time an observer subscribes to your store, or when the store has been disposed and that a new observer subscribes to the store.  
this is generally the place where you will subscribe to actions.

* `dispose(): void`: this method will be called whenever the store registered observers goes to 0.


Action
------

###Usage

An action is a function and an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md), each time you call the action function it will propagate a new value: 

```javascript
var Action = require('rx-flux').Action;

var myAction = Action.create();

myAction.subscribe(function (value) {
  console.log(value);
});

myAction('foo'); // log 'foo'
myAction('bar'); // log 'bar'
```

When creating an action you can also pass as argument a `map` function to `Action.create`, the value passed to the action will be transformed by that map function, the transformed result will be notified and returned by the action call : 

```javascript
var Action = require('rx-flux').Action;

var myAction = Action.create(function (string) {
  return string + ' bar';
});

myAction.subscribe(function (value) {
  console.log(value);
});

var result = myAction('foo'); // log 'foo bar'
console.log(result) // log 'foo bar'
```

Note that the `map` function will always be executed, even if there is no active subscription : 

```javascript
var Action = require('rx-flux').Action;

var myAction = Action.create(function (string) {
  console.log(string);
  return string + ' bar';
});

myAction('foo'); // log 'foo'
```

An action cannot propagate an `error` or `complete` notification, **if an error is thrown in the map function that error won't be catched** : 

```javascript
var Action = require('rx-flux').Action;

var myAction = Action.create(function () {
  throw new Error('error in map function');
});

myAction.subscribe(function (value) {
  console.log(value); // will never be called
}, function (error) {
  console.log(error); // will never be called
});

try {
  myAction('foo'); // no log
} catch(e) {
  e // Error('error in map function')
}
```

Finally `Action` provide a special operator `waitFor` that operator takes as arguments a list of observables and insure that those observable published a new value during the action notification process before passing the notification : 

```javascript
var Action = require('rx-flux').Action;
var Rx = require('rx');

var myAction = Action.create();
var subject1 = new Rx.Subject();
var subject2 = new Rx.Subject();

myAction.subscribe(function () {
  console.log('handler 1'); 
  subject1.onNext();
});

myAction.waitFor(subject1, subject2).subscribe(function () {
  console.log('handler 2'); 
});

myAction.subscribe(function () {
  console.log('handler 3'); 
  subject2.onNext();
});

myAction();// logs: 'handler 1', 'handler 3', 'handler 2'
```

###Api

Creating an action:
* `Action.create(map?: (val: A) => B): Rx.Observable<B> & (a: A) => B` : create a new action

Action instance api: 
* `waitFor(...observables: Rx.Observable[])`: Rx.Observable: create a new observable that waits that the observables passed as parameters publish a new value before notifying.
* `hasObservers(): boolean`: returns true if the action has subscribed observers.


Examples :
----------

Original examples from the [Flux](https://github.com/facebook/flux/) repository has been ported with rx-flux, see the [examples](https://github.com/fdecampredon/rx-flux/tree/master/examples/) directory.

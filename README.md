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

RxFlux shares more similiraties with [RefluxJS](https://github.com/spoike/refluxjs) than with the original architecture.

* A stores is an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) that *holds* a value
* An actions is a function and an [RxJS Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md)
* A store subscribes to an action and update accordingly its value.
* There is no central dispatcher.

The Store
---------

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

It also exposes a method `applyOperation`, this method allows to apply a transformation over the value held by te store:
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


###Api

The `Store` *class* inherits from [`Rx.Observable`](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md), it also exposes the following methods:

* `getValue(): any` : returns the value held by the store.

* `setValue(value: any | Promise): void` : set the value held by the store.<br/> 
If you pass a `Promise` to this method the value will be set to whatever the promise resolve to, also the store will pass in a *pending* state and won't publish any value until the promise is resolved. 
<br/>**this method will overwritte operations history**.

* `applyOperation(operation: (value: any) => any): { confirm: () => void, cancel: () }` : this method takes has parameter a function that should implements a transformation over the store value **never directly mutate the store value, but return a new object**.<br/> 
it returns an object with 2 methods `confirm` and `cancel` used to respectively to confirm or cancel the operation. **you need to confirm operations at some point to allow the store to free the internal history object, if you don't you are at risk of facing serious memory leak issues**.

* `applyOperation(operation: (value: any) => any, true): void` : this overload allows to directly confirm the operation, equivalent of `applyOperation(...).confirm()`

* `applyOperation(operation: (value: any) => any, promise: Promise): void` : if you pass a promise as the second argument of `applyOperation` the operation will be confirmed or canceled when that promise is resolved or rejected.

* `observe(observable: Rx.Observable<T>, handler: (val: t) => void): void`: a shortcut for `observable.subscribe(handler)`, however the resulting subscription will be automaticly disposed on store disposal.

You can also implements two *lifecycle* methods when *subclassing* the `Store`:
* `init(): void`: this method will be called the first time an observer subscribes to your store, or when the store has been disposed and that a new observer subscribes to the store. <br/>
this is generally the place where you will subscribe to actions.

* `dispose(): void`: this method will be called whenever the store registred observers count fall down to 0.


The Action
----------

TODO
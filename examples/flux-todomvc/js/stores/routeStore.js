var Store  = require('rx-flux').Store;
var Router = require('director').Router;
var Rx     = require('rx');

var routes = {
    ALL_TODOS: '',
    ACTIVE_TODOS: 'active',
    COMPLETED_TODOS: 'completed'
};

var RouteStore = Store.create({
  getInitialValue() {
    var currentRoute = new Rx.BehaviorSubject('');

    var router = Router({
        '/': function () {
          currentRoute.onNext(routes.ALL_TODOS); 
        },
        '/active': function () {
          currentRoute.onNext(routes.ACTIVE_TODOS); 
        },
        '/completed':function () {
          currentRoute.onNext(routes.COMPLETED_TODOS); 
        },
    });
    router.init('/');
    
    return currentRoute;
  }
});
  


RouteStore.routes = routes;


module.exports = RouteStore;
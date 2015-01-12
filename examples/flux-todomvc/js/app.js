/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

Object.assign = require('object-assign');

var React = require('react');
var TodoApp = require('./components/todoApp');
var TodoService = require('./services/todoService');

React.render(<TodoApp />, document.getElementById('todoapp'));


TodoService.init();
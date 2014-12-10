/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoActions
 */


var Action = require('rx-flux').Action;


function isNonEmptyString(string) {
  return string && typeof string === 'string';
}


var TodoActions = {

  /**
   * @param  {string} text
   */
  create: Action.create(function(text) {
    if (!isNonEmptyString(text)) {
      throw new Error('create action should receive a non empty text');
    }
    return text;
  }),

  /**
   * @param  {id : string, text: string} id The ID of the ToDo item, text the new text
   */
  updateText: Action.create(function(val) {
    var id = val.id;
    var text = val.text;
    if (!isNonEmptyString(id)) {
      throw new Error('id should be a non empty string');
    }
    
    if (!isNonEmptyString(text)) {
      throw new Error('id should be a non empty string');
    }
    return {
      id: id,
      text: text
    };
  }),

  /**
   * Toggle whether a single ToDo is complete
   * @param  {object} todo
   */
  toggleComplete: Action.create(function(id) {
    if (!isNonEmptyString(id)) {
      throw new Error('id should be a non empty string');
    }
    return id;
  }),

  /**
   * Mark all ToDos as complete
   */
  toggleCompleteAll: Action.create(),

  /**
   * @param  {string} id
   */
  destroy: Action.create(function(id) {
    if (!isNonEmptyString(id)) {
      throw new Error('id should be a non empty string');
    }
    return id;
  }),

  /**
   * Delete all the completed ToDos
   */
  destroyCompleted: Action.create()

};

module.exports = TodoActions;

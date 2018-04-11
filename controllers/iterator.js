// ===========================================================================
//  Diet.js
//  Iterator Controller
// ===========================================================================
"use strict"

// ===========================================================================
//  Dependencies
// ===========================================================================

const ArrayIterator = require('es6-iterator/array')

// ===========================================================================
//  Dependencies
// ===========================================================================

module.exports = function(route, signal, callback, state){
  const iterator = new ArrayIterator(route);

  function nextRoute(){
    if(!signal.stopped){
      const current = iterator.next()

      if(!current.done){
        current.value.handler(signal.request, signal.response, signal.app, nextRoute, signal)

      } else if (callback) {
        callback(signal)
      }
    }
  }
  if(route && route.length){
    signal.nextRoute = nextRoute
    nextRoute()

  } else if (callback) {
    callback(signal)
  }
}


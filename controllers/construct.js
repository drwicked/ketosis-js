// ===========================================================================
//  Diet.js
//  Construct Controller
// ===========================================================================

// ===========================================================================
//  Dependencies
// ===========================================================================

var merge = require('merge')
const clone = require('clone')




// ===========================================================================
//  Exports
// ===========================================================================

module.exports = function(constructName, constructRoot, app){
  module.app = app;

  const constructHolder = 'construct_' + constructName;
  const constructPath = app.path + '/' + constructRoot;
  if(!app[constructHolder]) app[constructHolder] = {};

  function Model(name){
    if(!app[constructHolder][constructPath + '/' + name]) {
      app[constructHolder][constructPath + '/' + name] = require(constructPath + '/' + name);
    }
    return app[constructHolder][constructPath + '/' + name];
  }

  function Controller(name, handler){
    if(!handler){
      if(!app[constructHolder][constructPath + '/' + name]) {
        app[constructHolder][constructPath + '/' + name] = require(constructPath + '/' + name);
      }
      return app[constructHolder][constructPath + '/' + name];
    }
  }

  if(constructName === 'model'){
    return Model;
  } else if (constructName === 'controller') {
    // Register a Proxy Setter/Getter to create Thunks dynamically around Controller Methods
    const ControllerProxy = new Proxy(Controller, {
      get: (target, name) => target[name],
      set: (target, name, originalFunction) => {
        if(typeof originalFunction === 'function'){
          // Create a Thunk Around the Function
          target[name] = function ControllerThunk(){
           const args = [];
           for(let i = 0; i < arguments.length; i++) args[i] = arguments[i]
             if(typeof args[args.length-1] === 'function'){
               originalFunction.apply(this, args)
             } else {
               return function(callback){
                 args[args.length] = callback;
                    //console.log('CONTROLLER CALL: ARGUMENTS -> ', args)
                    //console.log('CONTROLLER CALL: CALLBACK -> ', callback)
                    //console.log('CONTROLLER CALL: HANDLER ->', originalFunction.toString());
                    originalFunction.apply(this, args)
                 }
               }
             };
         } else {
           target[name] = originalFunction
         }
         return target[name];
       }
     });
    
    return ControllerProxy;
    
  } else if (constructName === 'view') {
    return function(config, renderer){
      if (renderer) {
        if(config === 'html'){
          app.html = true;
          app.header(($) => {
            $.htmlModule = function(pathname){
              if(!pathname || (pathname && pathname.indexOf(/\n|\r/) !== -1)){
                const path     = pathname || 'index.html' 
                const context  = merge(clone($, false, 1), $.data)
                const html     = renderer(path, context)
                $.response.end(html)
              } else if (pathname) {
                $.response.end(pathname)
              }
              $.nextRoute() // call next route
            }
            $.return()
          })
         } else if (config === 'file' || config === 'files' || config === 'static') {
           app.footer(renderer)
         }
       } else {
        if(!app[constructHolder][constructPath + '/' + config]) {
          app[constructHolder][constructPath + '/' + config] = require(constructPath + '/' + config);
        }
        return app[constructHolder][constructPath + '/' + config];

      }
    }
  }
}


/* eslint-disable import/no-nodejs-modules */
// ===========================================================================
//  Diet.js
//  Router Controller
// ===========================================================================
"use strict"

// ===========================================================================
//  Dependencies
// ===========================================================================

const errorPage = require('./error')
const Next = require('nextjs')
const pathToRegex = require('path-to-regexp')
const Domain = require('domain')
const async = require('async')

const parent = module.parent.exports
const Generator = (function*(){}).constructor;

// ===========================================================================
//  Exports
// ===========================================================================

module.exports = function(method, type, app){
  return function(path){
    
    const args = arguments;
    const argsLength = args.length > 1 ? args.length : 1 ;
    const stringMethod = (type === 'method') && typeof path === 'string';
    const keys = [];
    
    const route = {
      path,
      paramKeys: stringMethod ? keys : false,
      paramRegex: stringMethod ? pathToRegex(path, keys) : false,
      handler: (request, response, app, nextRoute, signal) => {
        const next = new Next(argsLength, () => {
          app.emit('route.end', { method, path, route, app, type, signal });
          signal.nextRoute();
        })
        
        let count = 0;
        app.emit('route.start', { method, path, route, app, type, signal });
        
        (function nextController(){
          // console.log('\n## controller', 'count=', count, '| argsLength=',argsLength)
          
          if(count <= argsLength){

            const controller = args[count];
            
            app.emit('route.controller.start', { method, path, route, app, type, controller, signal, current: count, total: argsLength})
            
            if(typeof controller === 'function'){

              // console.log(' --> controller [ STARTED ]')
              signal.return = function(){ 
               app.emit('route.controller.end', { method, path, route, app, type, signal });
                // console.log(' --> controller [ RETURNED ]')
                count++; nextController(); next();
                //signal.nextRoute();
              }
              
              const domain = Domain.create();
              
              domain.on('error', (error) => { 
                if (error.stack) console.error(error.stack);

                signal.fail.route = route;
                signal.fail.error = error;
                signal.fail.controller = controller;

                app.emit('route.controller.error', { method, path, route, app, type, controller, error, signal })

                errorPage(error, signal, app, controller);
              });
              
              domain.run(() => {
                // If the controller is a Generator
                if(controller instanceof Generator){

                  // Create Iterator 
                  const iterator = controller(signal);
                  
                  // Resurscive Iterator
                  (function nextIteration(error, value){
                      // Get the next Iteration
                      const result = iterator.next(value);
                      
                      app.emit('route.controller.iterate.start', { method, path, route, app, type, controller, signal, result})
                      
                      // If iterator is not finishd
                      if(!result.done){
                          // function
                          if(typeof result.value === 'function'){
                            result.value(nextIteration)

                            // array of functions
                          } else if (typeof result.value === 'object') {
                            async.each(result.value, (item, callback) => {
                              item((error, result) =>{
                                callback({ error, result })
                              });
                            }, (values) => {
                              nextIteration(values.error, values.result);
                            })

                            // unknown type
                          } else {
                            nextIteration(error, value);
                          }

                        // Call next controller
                      } else {
                        app.emit('route.controller.iterate.end', { method, path, route, app, type, controller, signal})
                            //count++; 
                            //nextController(); 
                        }
                      })()
                  // Run Simple Function 
               } else {
                controller(signal)
              }
            })
            } else {
              app.emit('route.controller.skip', { method, path, route, app, type, controller, signal })
              // console.log(' --> controller [ SKIP ]', controller)
              count++; nextController(); next();
            }
          } else {
           app.emit('route.controller.end', { method, path, route, app, type, signal })
              //count++;// next();
            // console.log('--> controller DONE!')
          }
        })()
      }
    }
    
    if(!app.routes) app.routes = {}
      if(!app.routes[method]) app.routes[method] = [];

    if(type === 'method'){

     const pathRegister = (!isNaN(path)) ? path+'_status' : path
     if(!app.routes[method][pathRegister]) app.routes[method][pathRegister] = [];
     app.routes[method][pathRegister].push(route)

   } else {

     app.routes[method].push(route)

   }

   app.emit('route.attach', { method, path, route, type })

   return app;
 }

 return app;
}


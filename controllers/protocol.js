// ===========================================================================
//  Diet.js
//  Protocol Controller
// ===========================================================================
module.exports = function(app){
  return function(name, handler){
    app.emit('protocol.attach', { app, name, handler })
    app.protocols.push({ name, handler })
    return app;
  }
}

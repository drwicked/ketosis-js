"use strict"
const utils = require('./utils')

module.exports = function(app, servers){
	return function(location, options){
		app.emit('host', { app, location, options })
		const host = utils.getHost(location, options)
		app.hosts[host.location.host] = app
	}
}

const url = require('url')
const Utils = new Object()

Utils.isset = function isset(object){
	return (
		object !== "undefined"
		&& object !== undefined
		&& object !== null
		&& object !== ""
		&& typeof(object) !== 'undefined');
}

Utils.getHost = function(inputLocation, options){
	options = !options || typeof options === 'function' ? {} : options ;
	const protocolName = (typeof options === 'object' && options.cert || options.key || options.ca) ? 'https' : 'http' ;

	// define location
	let location = inputLocation;
	if (typeof inputLocation !== 'object') {
		if(!isNaN(inputLocation)) {
			location = url.parse(protocolName+'://0.0.0.0:'+inputLocation);
		} else if(typeof inputLocation === 'string') {
			location = inputLocation.indexOf('://') === -1 ? 'http://' + inputLocation : inputLocation ;
			location = url.parse(location) 
		} else if(!Utils.isset(inputLocation)){
			location = url.parse(protocolName+'://0.0.0.0:80/');
		}
	}
	
	const port = location.protocol === 'http:' && (!options || (!options.cert && !options.key)) 
		? (location.port || 80) 
		: (location.port || 443) ;
	
	return { port, location }
}

module.exports = Utils

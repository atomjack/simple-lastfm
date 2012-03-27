var myhttp = require('http-get');
var crypto = require('crypto');
var xml2js = require('xml2js');
var querystring = require('querystring');
var http = require('http');
var $ = require('jquery');

var Lastfm = function() {
	var api_key;
	var api_secret;
	var username;
	var password;
	var session_key;
};

Lastfm.prototype.init = function(options) {
	this.api_key = options.api_key;
	this.api_secret = options.api_secret;
	this.username = options.username;
	this.password = options.password;
	if(options.session_key)
		this.session_key = options.session_key;
};

Lastfm.prototype.getSessionKey = function(callback) {
	var authToken = md5(this.username + md5(this.password));
	var sig = 'api_key' + this.api_key + 'authToken' + authToken + 'methodauth.getMobileSessionusername' + this.username + this.api_secret;
	var api_sig = md5(sig);
	
	var url = 'http://ws.audioscrobbler.com/2.0/?method=auth.getMobileSession&' +
		'username=' + this.username + '&' + 
		'authToken=' + authToken + '&' +
		'api_key=' + this.api_key + '&' +
		'api_sig=' + api_sig;
	var options = {
			url: url
	};
	myhttp.get(options, function(error,getresult) {
		try {
			var parser = new xml2js.Parser();
			parser.parseString(getresult.buffer, function(err, result) {
				var ret = {
					success: result['@'].status == 'ok'
				};
				if(ret.success) {
					ret.session_key = result.session.key;
					this.session_key = result.session.key;
				} else
					ret.error = result.error['#'];
				if(typeof callback == 'function') {
					callback(ret);
				}
			});
		} catch(e) {
			console.log("Exception: ", e);
		}

	});
};

Lastfm.prototype.scrobbleTrack = function(opt) {
	var options = $.extend(opt || {}, {method: 'track.scrobble'});
	this.doScrobble(options);
};

Lastfm.prototype.loveTrack = function(opt) {
	var options = $.extend(opt || {}, {method: 'track.love'});
	this.doScrobble(options);
};

Lastfm.prototype.doScrobble = function(options) {
	console.log("Starting scrobbleTrack: ", options);
	options = options || {};
//	session.scrobbled = true;
	options.timestamp = options.timestamp != undefined ? Math.floor(options.timestamp) :  Math.floor(now() / 1000);
	
	//var timestamp =
	
	console.log("Using session key: " + this.session_key + "\n\n");
	var authToken = md5(this.username + md5(this.password));
//	console.log("authToken = " + authToken);
	var sig = 'api_key' + this.api_key + 'artist' + options.artist + 'method' + options.method + 'sk' + this.session_key + 'timestamp' + options.timestamp + 'track' + options.track + this.api_secret;
//	console.log("sig = " + sig);
	var api_sig = md5(sig);
//	console.log("api sig = " + api_sig);
	
	var post_data = querystring.stringify({
		api_key: this.api_key,
		method: options.method,
		sk: this.session_key,
		api_sig: api_sig,
		timestamp: options.timestamp,
		artist: options.artist,
		track: options.track
	});
	
//	console.log("post_data: ", post_data);
	
	var post_options = {
		host: 'ws.audioscrobbler.com',
	      port: '80',
	      path: '/2.0/',
	      method: 'POST',
	      headers: {
	          'Content-Type': 'application/x-www-form-urlencoded',
	          'Content-Length': post_data.length
	      }
	};
	
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
//			console.log('Response: ' + chunk);
			var parser = new xml2js.Parser();
			parser.parseString(chunk, function(err, result) {
				try {
					if (result['@'].status == 'ok') {
						lastfm_failed_attempts = 0;
						console.log("Track scrobbled (" + options.method + " )");
						if(typeof options.callback == 'function') {
							options.callback(result);
						}
					} else {
						console.log("result: ", result);
						lastfm_failed_attempts++;
						if (lastfm_failed_attempts < 5) {
							reAuthLastFm(function(key){
								console.log("Got reauth key: " + key);
								settings.lastfm_failed_attempts_key = key;
								saveSettings();
								scrobbleTrack(options);
							});
						} else {
							console.log("Failed to scrobble 5 times in a row, so giving up");
							lastfm_failed_attempts = 0;
						}
					}
				} catch(e) {
					console.log("Exception parsing scrobble result: ", e);
					console.log("Chunk: ", chunk);
				}
			});
		});
	});
	post_req.write(post_data);
	post_req.end();
};


function now() {
	return new Date().getTime();
}

function md5(string) {
	return crypto.createHash('md5').update(string, 'utf8').digest("hex");
}

module.exports = Lastfm;

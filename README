#Simple-Lastfm

A simple nodejs library to interface with last.fm

## Examples

First, you'll need to get an API key from last.fm: http://www.last.fm/api/account
Once you have your API key and API secret, you'll need to generate a session key, after which you can then start to scrobble:

```js
var Lastfm = require('./simple-lastfm/');

var lastfm = new Lastfm;

lastfm.init({
	api_key: 'xxx',
	api_secret: 'xxx',
	username: 'xxx',
	password: 'xxx'
});

lastfm.getSessionKey(function(result) {
	console.log("session key = " + result.session_key);
	lastfm.scrobbleTrack({
		artist: 'Bonobo',
		track: 'Black Sands',
		callback: function(result) {
			console.log("in callback, finished: ", result);
		}
	});
});

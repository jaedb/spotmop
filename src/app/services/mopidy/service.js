/*
 * Inspired and mostly coming from MartijnBoland's MopidyService.js
 * https://github.com/martijnboland/moped/blob/master/src/app/services/mopidyservice.js
 */
'use strict';

angular.module('spotmop.services.mopidy', [
    //"spotmop.services.settings",
    //'llNotifier'
])

.factory("MopidyService", function($q, $rootScope, $cacheFactory, $location, $timeout, SettingsService, PusherService, NotifyService, cfpLoadingBar ){
	
	// Create consolelog object for Mopidy to log it's logs on
    var consoleLog = function () {};
    var consoleError = console.error.bind(console);

    /*
     * Wrap calls to the Mopidy API and convert the promise to Angular $q's promise.
     * 
     * @param String functionNameToWrap
     * @param Object thisObj
     */
	function wrapMopidyFunc(functionNameToWrap, thisObj) {
		return function() {
			var deferred = $q.defer();
			var args = Array.prototype.slice.call(arguments);
			var self = thisObj || this;

			executeFunctionByName(functionNameToWrap, self, args).then(function(data){
				deferred.resolve(data);
			}, function(err) {
				NotifyService.error( err );
				deferred.reject(err);
			});
			
			return deferred.promise;
		};
	}

	/*
     * Execute the given function
     * 
     * @param String functionName
     * @param Object thisObj
	 * @param Array args
     */
	function executeFunctionByName(functionName, context, args){
		
		var namespaces = functionName.split(".");
		var func = namespaces.pop();
        
		for(var i = 0; i < namespaces.length; i++){
			context = context[namespaces[i]];
		}

		return context[func].apply(context, args);
	}

	return {
		mopidy: {},
		isConnected: false,
		
		testMethod: function( method, payload ){
			console.info( 'Performing test method: '+method+' with payload:'+ payload);
			return wrapMopidyFunc(method, this)( payload );
		},
		
		/*
		 * Method to start the Mopidy conneciton
		 */
		start: function(){
            var self = this;

			// Emit message that we're starting the Mopidy service
			$rootScope.$broadcast("spotmop:startingmopidy");

            // Get mopidy ip and port from settigns
            var mopidyhost = SettingsService.getSetting("mopidy.host");
			if( !mopidyhost ) mopidyhost = window.location.hostname;
            var mopidyport = SettingsService.getSetting("mopidy.port");
			if( !mopidyport ) mopidyport = "6680";
			var protocol = 'ws'; 
			if( window.location.protocol != "http:" ) protocol = 'wss';
			
			// Initialize mopidy
            try{
    			this.mopidy = new Mopidy({
				webSocketUrl: protocol+"://" + mopidyhost + ":" + mopidyport + "/mopidy/ws",
    				callingConvention: 'by-position-or-by-name'
    			});
		
				// this gives us a handy list of all functions available via mopidy
				// console.log( this.mopidy );
            }
			catch(e){
                // need to re-initiate notifier
				console.log( "Connecting with Mopidy failed with the following error message: " + e);
                // Try to connect without a given url
                this.mopidy = new Mopidy({
                    callingConvention: 'by-position-or-by-name'
                });
            }
			
			this.mopidy.on(consoleLog);
			
			// Convert Mopidy events to Angular events
			this.mopidy.on(function(ev, args) {
				$rootScope.$broadcast('mopidy:' + ev, args);
				if (ev === 'state:online') {
					self.isConnected = true;
				}
				if (ev === 'state:offline') {
					self.isConnected = false;
				}
			});

			$rootScope.$broadcast('spotmop:mopidystarted', this);
		},
		stop: function() {
			$rootScope.$broadcast('spotmop:mopidystopping');
			this.mopidy.close();
			this.mopidy.off();
			this.mopidy = null;
			$rootScope.$broadcast('spotmop:mopidystopped');
		},
		restart: function() {
			this.stop();
			this.start();
		},
		getUriSchemes: function() {
			return wrapMopidyFunc("mopidy.getUriSchemes", this)({});
		},
		getLibrary: function() {
			return wrapMopidyFunc("mopidy.library.browse", this)({ uri: null });
		},
		getLibraryItems: function(uri) {
			return wrapMopidyFunc("mopidy.library.browse", this)({ uri: uri });
		},
		refresh: function(uri) {
			return wrapMopidyFunc("mopidy.library.refresh", this)({ uri: uri });
		},
		getDirectory: function(uri) {
			return wrapMopidyFunc("mopidy.library.lookup", this)({ uri: uri });
		},
		getTrack: function(uri) {
			return wrapMopidyFunc("mopidy.library.lookup", this)({ uri: uri });
		},
		getTracks: function(uris) {
			return wrapMopidyFunc("mopidy.library.lookup", this)({ uris: uris });
		},
		getAlbum: function(uri) {
			return wrapMopidyFunc("mopidy.library.lookup", this)({ uri: uri });
		},
		getArtist: function(uri) {
			return wrapMopidyFunc("mopidy.library.lookup", this)({ uri: uri });
		},
		getImages: function(uris){
			return wrapMopidyFunc("mopidy.library.getImages", this)({ uris: uris });
		},
		search: function(fields, searchterm, backends){			
			if( typeof(backends) === 'undefined' ) var backends = null;			
			if( typeof(fields) === 'undefined' || !fields ) var fields = ['any'];
			var query = {};
			for( var i = 0; i < fields.length; i++ ){
				query[fields[i]] = [searchterm];
			}
			return wrapMopidyFunc("mopidy.library.search", this)({ query: query, uris: backends });
		},
		getCurrentTrack: function() {
			return wrapMopidyFunc("mopidy.playback.getCurrentTrack", this)();
		},
		getCurrentTlTrack: function() {
			return wrapMopidyFunc("mopidy.playback.getCurrentTlTrack", this)();
		},
		moveTlTracks: function( start, end, to_position ) {
			return wrapMopidyFunc("mopidy.tracklist.move", this)({ start: start, end: end, to_position: to_position });
		},
		getTimePosition: function() {
			return wrapMopidyFunc("mopidy.playback.getTimePosition", this)();
		},
		seek: function(timePosition) {
			return wrapMopidyFunc("mopidy.playback.seek", this)({ time_position: timePosition });
		},
		getVolume: function() {
			return wrapMopidyFunc("mopidy.playback.getVolume", this)();
		},
		setVolume: function(volume) {
			return wrapMopidyFunc("mopidy.playback.setVolume", this)({ volume: volume });
		},
		getMute: function(){
			return wrapMopidyFunc("mopidy.playback.getMute", this)();
		},
		setMute: function( isMute ){
			return wrapMopidyFunc("mopidy.playback.setMute", this)([ isMute ]);
		},
		getState: function() {
			return wrapMopidyFunc("mopidy.playback.getState", this)();
		},
		playTrack: function( trackUris, trackToPlayIndex, at_position ){
			
			var self = this;
			if( typeof(at_position) === 'undefined' ) var at_position = 0;
			
			cfpLoadingBar.start();
			cfpLoadingBar.set(0.25);
			
			// add the first track immediately
			return self.mopidy.tracklist.add({ uris: [ trackUris.shift() ], at_position: at_position })
			
				// then play it
				.then( function( response ){
					
					// make sure we added the track successfully
					// this handles failed adds due to geo-blocked spotify and typos in uris, etc
					var playTrack = null;					
					if( response.length > 0 ){
						playTrack = { tlid: response[0].tlid };
					}
					
					return self.mopidy.playback.play( playTrack )
				
						// now add all the remaining tracks
						.then( function(){
							if( trackUris.length > 0 ){
								return self.mopidy.tracklist.add({ uris: trackUris, at_position: at_position+1 })
									.then( function(){
										cfpLoadingBar.complete();
									});
							}
						}, consoleError);
				}, consoleError);
		},
		playTlTrack: function( tlTrack ){
            return this.mopidy.playback.play( tlTrack );
		},
		playStream: function( streamUri, expectedTrackCount ){
			
			cfpLoadingBar.start();
			cfpLoadingBar.set(0.25);			
				
			var self = this;
			
			self.stopPlayback(true)
				.then(function() {
					self.mopidy.tracklist.clear();
				}, consoleError)
				.then(function() {
					self.mopidy.tracklist.add({ at_position: 0, uri: streamUri })
						.then( function(){
							cfpLoadingBar.complete();
						});
				}, consoleError)
				.then(function() {
					self.mopidy.playback.play();
				}, consoleError);
		},
		playLocalPlaylist: function( uri ) {
			var self = this;
			
			cfpLoadingBar.start();
			cfpLoadingBar.set(0.25);
			
			var trackUris = [];
			self.getPlaylist( uri )
				.then( function(response){	
					self.mopidy.tracklist.clear();				
					for( var i = 0; i < response.tracks.length; i++ ){
						trackUris.push( response.tracks[i].uri );
					}
				})
				.then( function(){
					
					// add the first track immediately
					return self.mopidy.tracklist.add({ uris: [ trackUris.shift() ], at_position: 0 })
					
						// then play it
						.then( function( response ){
							
							// make sure we added the track successfully
							// this handles failed adds due to geo-blocked spotify and typos in uris, etc
							var playTrack = null;					
							if( response.length > 0 ){
								playTrack = { tlid: response[0].tlid };
							}
							
							return self.mopidy.playback.play( playTrack )
						
								// now add all the remaining tracks
								.then( function(){
									if( trackUris.length > 0 ){
										return self.mopidy.tracklist.add({ uris: trackUris, at_position: 1 })
											.then( function(){
												cfpLoadingBar.complete();
											});
									}
								}, consoleError);
						}, consoleError);
				});
		},
		play: function(){
			return wrapMopidyFunc("mopidy.playback.play", this)();
		},
		pause: function() {
			return wrapMopidyFunc("mopidy.playback.pause", this)();
		},
		stopPlayback: function(clearCurrentTrack) {
			return wrapMopidyFunc("mopidy.playback.stop", this)();
		},
		previous: function() {
			return wrapMopidyFunc("mopidy.playback.previous", this)();
		},
		next: function(){		
		
			var name = SettingsService.getSetting('pusher.name');
			if( !name ) name = 'User';
			
			var icon = '';
			var spotifyuser = SettingsService.getSetting('spotifyuser');  
			if( spotifyuser ) icon = spotifyuser.images[0].url;
            
            PusherService.broadcast({
				type: 'notification',
				ignore_self: true,
                data: {
                    title: 'Track skipped',
                    body: name +' vetoed this track!',
                    icon: icon
                }
            });
			return wrapMopidyFunc("mopidy.playback.next", this)();
		},
		getRepeat: function () {
			return wrapMopidyFunc("mopidy.tracklist.getRepeat", this)();
		},
		setRepeat: function( isRepeat ){
			return wrapMopidyFunc("mopidy.tracklist.setRepeat", this)([ isRepeat ]);
		},
		getRandom: function () {
			return wrapMopidyFunc("mopidy.tracklist.getRandom", this)();
		},
		setRandom: function( isRandom ) {
			return wrapMopidyFunc("mopidy.tracklist.setRandom", this)([ isRandom ]);
		},
		getConsume: function () {
			return wrapMopidyFunc("mopidy.tracklist.getConsume", this)();
		},
		setConsume: function( isConsume ) {
			return wrapMopidyFunc("mopidy.tracklist.setConsume", this)([ isConsume ]);
		},
		getCurrentTrackList: function () {
			return wrapMopidyFunc("mopidy.tracklist.getTracks", this)();
		},
		clearCurrentTrackList: function () {
			return wrapMopidyFunc("mopidy.tracklist.clear", this)();
		},
		getCurrentTlTracks: function () {
			return wrapMopidyFunc("mopidy.tracklist.getTlTracks", this)();
		},
		addToTrackList: function( uris, at_position ){
			if( typeof( at_position ) === 'undefined' ) var at_position = null;
			return wrapMopidyFunc("mopidy.tracklist.add", this)({ uris: uris, at_position: at_position });
		},
		removeFromTrackList: function( tlids ){
			var self = this;
			self.mopidy.tracklist.remove({tlid: tlids}).then( function(){
				return true;
			});
		},
		
		/**
		 * Playlists
		 **/		 
		getPlaylists: function() {
			return wrapMopidyFunc("mopidy.playlists.asList", this)();
		},
		getPlaylist: function(uri) {
			return wrapMopidyFunc("mopidy.playlists.lookup", this)({ uri: uri });
		},
		createPlaylist: function(name, uri_scheme){
			if( typeof(uri_scheme) === 'undefined' ) var uri_scheme = 'm3u';
			return wrapMopidyFunc("mopidy.playlists.create", this)({ name: name, uri_scheme: uri_scheme });
		},
		deletePlaylist: function(uri){
			return wrapMopidyFunc("mopidy.playlists.delete", this)({ uri: uri });
		},
		addTracksToPlaylist: function(uri, trackuris){
			var self = this;			
			return self.getPlaylist(uri)
				.then( function(playlist){
                    if( typeof(playlist.tracks) === 'undefined' ) playlist.tracks = [];
					for( var i = 0; i < trackuris.length; i++ ){
						playlist.tracks.push({
							__model__: "Track",
							uri: trackuris[i]
						});
					}
					return wrapMopidyFunc("mopidy.playlists.save", self)({ playlist: playlist });
				});
		},
		movePlaylistTracks: function(uri, trackuris){
			var self = this;			
			return self.getPlaylist(uri)
				.then( function(playlist){
                    playlist.tracks = [];
					for( var i = 0; i < trackuris.length; i++ ){
						playlist.tracks.push({
							__model__: "Track",
							uri: trackuris[i]
						});
					}
					return wrapMopidyFunc("mopidy.playlists.save", self)({ playlist: playlist });
				});
		},
		deleteTracksFromPlaylist: function(uri, indexes){
			var self = this;
			
			// reverse order our indexes (otherwise removing from top will affect the keys following)			
			function descending(a,b){
				return b-a;
			}
			indexes.sort(descending);
			
			return self.getPlaylist(uri)
				.then( function(playlist){
					for( var i = 0; i < indexes.length; i++ ){
						playlist.tracks.splice(indexes[i], 1);
					}
					return wrapMopidyFunc("mopidy.playlists.save", self)({ playlist: playlist });
				});
		}

	};
});

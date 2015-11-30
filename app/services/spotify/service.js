/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.spotify', [])

.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', '$filter', '$q', 'SettingsService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, $filter, $q, SettingsService ){
	
	// plug in our authentication iframe
	var frame = $('<iframe id="authentication-frame" style="width: 1px; height: 1px;"></iframe>');
	$(body).append(frame);

	// set container for spotify storage
	if( typeof($localStorage.spotify) === 'undefined' )
		$localStorage.spotify = {};
		
	if( typeof($localStorage.spotify.AccessToken) === 'undefined' )
		$localStorage.spotify.AccessToken = null;
		
	if( typeof($localStorage.spotify.RefreshToken) === 'undefined' )
		$localStorage.spotify.RefreshToken = null;
		
	if( typeof($localStorage.spotify.AuthorizationCode) === 'undefined' )
		$localStorage.spotify.AuthorizationCode = null;
		
	if( typeof($localStorage.spotify.AccessTokenExpiry) === 'undefined' )
		$localStorage.spotify.AccessTokenExpiry = null;
		
	if( typeof($localStorage.spotify.ClientID) === 'undefined' )
		$localStorage.spotify.ClientID = 'a87fb4dbed30475b8cec38523dff53e2';
	
	// we haven't been authorized to a spotify account yet, so go authorize
	if( !$localStorage.spotify.AuthorizationCode )
		getAuthorizationCode();

	// on load, get a new token
	// this means we [easily] know how long it's been since last refreshed
	getNewToken();
	
	// setup automatic refreshing (tokens last for 3600 seconds, so let's refresh every 3500 seconds)
	$interval( getNewToken, 3500000 );
	
	// listen for incoming messages from the authorization iframe
	window.addEventListener('message', function(event){
		
		// only allow incoming data from our authorized authenticator proxy
		if( event.origin !== "http://jamesbarnsley.co.nz" )
			return false;
		
		// convert to json
		var data = JSON.parse(event.data);
		
		// take our returned data, and save it to our localStorage
		$localStorage.spotify.AuthorizationCode = data.authorization_code;
		$localStorage.spotify.AccessToken = data.access_token;
		$localStorage.spotify.RefreshToken = data.refresh_token;
		$rootScope.spotifyOnline = true;
	}, false);
	
	/**
	 * Get a Spotify API authorisation code
	 * This is only needed once for this account on this device. It is used to acquire access tokens (which expire)
	 **/
	function getAuthorizationCode(){
		frame.attr('src', 'http://jamesbarnsley.co.nz/spotmop.php?action=authorize&app='+location.protocol+'//'+window.location.host );
	}
	
	/**
	 * Get a new access token
	 * These expire, so require frequent refreshing
	 **/
	function getNewToken(){
		return $.ajax({
			url: 'http://jamesbarnsley.co.nz/spotmop.php?action=refresh&refresh_token='+$localStorage.spotify.RefreshToken,
			type: "GET",
			dataType: "jsonp",
			async: false,
			timeout: 5000,
			success: function(response){
				var responseJson = JSON.parse( response );
				$localStorage.spotify.AccessToken = response.access_token;
				$localStorage.spotify.AccessTokenExpiry = new Date().getTime() + 3600000;
				$rootScope.spotifyOnline = true;
			},
			fail: function(response){
				notifyUser('bad','There was a problem connecting to Spotify: '+response.responseJSON.error.message);
				$rootScope.spotifyOnline = false;
			}
		});
	}

	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	var country = SettingsService.getSetting("spotifycountry", 'NZ');
	var locale = SettingsService.getSetting("spotifylocale", "en_NZ");
	
	// setup response object
    return {
		
		logout: function(){
			$localStorage.spotify = {};
			$rootScope.spotifyOnline = false;
		},
	   
        getNewToken: function(){
            getNewToken();  
        },
        
		/**
		 * Get an element from a URI
		 * @param element = string, the element we wish to extract
		 * @param uri = string
		 **/
		getFromUri: function( element, uri ){
			var exploded = uri.split(':');			
			if( element == 'userid' && exploded[1] == 'user' )
				return exploded[2];				
			if( element == 'playlistid' && exploded[3] == 'playlist' )
				return exploded[4];				
			if( element == 'artistid' && exploded[1] == 'artist' )
				return exploded[2];				
			if( element == 'albumid' && exploded[1] == 'album' )
				return exploded[2];				
			if( element == 'trackid' && exploded[1] == 'track' )
				return exploded[2];				
			return null;
		},
        
        /**
         * Generic calls
         */
        getUrl: function( $url ){
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: $url,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getUrl', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
        /**
         * Users
         **/
        
        getMe: function(){
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'me/',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getMe', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
        getUser: function( useruri ){
		
			var userid = this.getFromUri( 'userid', useruri );
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'users/'+userid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getUser', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
		
		isFollowing: function( type, uri ){
			
			var id = this.getFromUri( type+'id', uri );
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'me/following/contains?type='+type+'&ids='+id,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'isFollowing', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
        
        
        /**
         * Track based requests
         **/
	
		getTrack: function( trackuri ){
			
			var trackid = this.getFromUri('trackid', trackuri);
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'tracks/'+trackid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getTrack', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
        
	
		/**
		 * Library requests
		 * These are mostly /me related
		 **/   
		
		getMyTracks: function( userid ){
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'me/tracks/',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getMyTracks', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		}, 
		
		addTracksToLibrary: function( trackids ){
			
            var deferred = $q.defer();

            $http({
					method: 'PUT',
					url: urlBase+'me/tracks',
					dataType: "json",
					data: JSON.stringify( { ids: trackids } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'addTracksToLibrary', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		deleteTracksFromLibrary: function( trackids ){
			
            var deferred = $q.defer();

            $http({
					method: 'DELETE',
					url: urlBase+'me/tracks',
					dataType: "json",
					data: JSON.stringify( { ids: trackids } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'deleteTracksFromLibrary', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getMyArtists: function( userid ){
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'me/following?type=artist',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getMyArtists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		isFollowingArtist: function( artisturi, userid ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );			
			
            var deferred = $q.defer();

            $http({
					cache: false,
					method: 'GET',
					url: urlBase+'me/following/contains?type=artist&ids='+artistid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'isFollowingArtist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		followArtist: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );			
			
            var deferred = $q.defer();

            $http({
					method: 'PUT',
					cache: false,
					url: urlBase+'me/following?type=artist&ids='+artistid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'followArtist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		unfollowArtist: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );			
			
            var deferred = $q.defer();

            $http({
					method: 'DELETE',
					cache: false,
					url: urlBase+'me/following?type=artist&ids='+artistid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'unfollowArtist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
	
		/**
		 * Playlist-oriented requests
		 **/     
		
		getPlaylists: function( userid, limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
				
			
            var deferred = $q.defer();

            $http({
					cache: false,
					method: 'GET',
					url: urlBase+'users/'+userid+'/playlists?limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getPlaylists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getPlaylist: function( playlisturi ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
				
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'?market='+country,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		isFollowingPlaylist: function( playlisturi, ids ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers/contains?ids='+ids,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'isFollowingPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		followPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			
            var deferred = $q.defer();

            $http({
					method: 'PUT',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'followPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		unfollowPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			
            var deferred = $q.defer();

            $http({
					method: 'DELETE',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'unfollowPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		featuredPlaylists: function( limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
			
			var timestamp = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss');
			var country = SettingsService.getSetting('countrycode','NZ');
			
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/featured-playlists?timestamp='+timestamp+'&country='+country+'&limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'featuredPlaylists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		addTracksToPlaylist: function( playlisturi, tracks ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			
            var deferred = $q.defer();

            $http({
					method: 'POST',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
					//url: urlBase+'users/'+$localStorage.spotify.userid+'/playlists/'+playlistid+'/tracks',
					dataType: "json",
					data: JSON.stringify( { uris: tracks } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'addTracksToPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		movePlaylistTracks: function( playlisturi, range_start, range_length, insert_before ){
            
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
            if( userid != SettingsService.getSetting('spotifyuserid',null) )
                return false;
			
			
            var deferred = $q.defer();

            $http({
					method: 'PUT',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
					dataType: "json",
					data: JSON.stringify({
						range_start: range_start,
						range_length: range_length,
						insert_before: insert_before
					}),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'movePlaylistTracks', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		deleteTracksFromPlaylist: function( playlisturi, tracks ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			
            var deferred = $q.defer();

            $http({
					method: 'DELETE',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
					//url: urlBase+'users/'+$localStorage.spotify.userid+'/playlists/'+playlistid+'/tracks',
					dataType: "json",
					data: JSON.stringify( { tracks: tracks } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'deleteTracksFromPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		// create a new playlist
		// @param userid id of the user to own this playlist (usually self)
		// @param data json array {name: "Name", public: boolean}
		createPlaylist: function( userid, data ){
			
            var deferred = $q.defer();

            $http({
					method: 'POST',
					url: urlBase+'users/'+userid+'/playlists/',
					dataType: "json",
					data: data,
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'createPlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		// update a playlist's details
		// @param playlisturi
		// @param data json array {name: "Name", public: boolean}
		updatePlaylist: function( playlisturi, data ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
            var deferred = $q.defer();

            $http({
					method: 'PUT',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid,
					dataType: "json",
					data: data,
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'updatePlaylist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		/**
		 * Discover
		 **/
		newReleases: function( limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/new-releases?country='+ country +'&limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'newReleases', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		discoverCategories: function( limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/categories?limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'discoverCategories', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getCategory: function( categoryid ){
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/categories/'+categoryid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getCategory', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getCategoryPlaylists: function( categoryid, limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/categories/'+categoryid+'/playlists?limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getCategoryPlaylists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		/**
		 * Artist
		 **/
		 
		getArtist: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getArtist', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		 
		getArtists: function( artisturis ){
			
			var self = this;
			var artistids = '';
			angular.forEach( artisturis, function( artisturi ){
				if( artistids != '' ) artistids += ',';
				artistids += self.getFromUri( 'artistid', artisturi );
			});
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'artists/?ids='+artistids,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getArtists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getAlbums: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid+'/albums?album_type=album,single&market='+country,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getArtists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getAlbum: function( albumuri ){
						
            var deferred = $q.defer();			
			var albumid = this.getFromUri( 'albumid', albumuri );

            $http({
					method: 'GET',
					url: urlBase+'albums/'+albumid,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getAlbum', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getTopTracks: function( artisturi ){
		
			var artistid = this.getFromUri( 'artistid', artisturi );			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid+'/top-tracks?country='+country,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getTopTracks', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getRelatedArtists: function( artisturi ){
		
			var artistid = this.getFromUri( 'artistid', artisturi );
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid+'/related-artists',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getRelatedArtists', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		/**
		 * Search results
		 * @param type = string (album|artist|track|playlist)
		 * @param query = string (search term)
		 * @param limit = int (optional)
		 **/
		getSearchResults: function( type, query, limit ){
		
			if( typeof( limit ) === 'undefined' ) limit = 10;
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'search?q='+query+'&type='+type+'&country='+country+'&limit='+limit,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getSearchResults', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		}
	};
}]);






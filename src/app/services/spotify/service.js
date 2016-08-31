/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.spotify', [])

.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', '$filter', '$q', '$cacheFactory', 'SettingsService', 'NotifyService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, $filter, $q, $cacheFactory, SettingsService, NotifyService ){
	
	// setup response object
    var service = {
		
		authenticationMethod: 'server',
		
		start: function(){
	
			// inject our authorization frame, on the placeholder action
			var frame = $('<iframe id="authorization-frame" style="width: 1px; height: 1px; display: none;" src="//jamesbarnsley.co.nz/spotmop.php?action=frame"></iframe>');
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
			
			// listen for incoming messages from the authorization iframe
			window.addEventListener('message', function(event){
				
				// only allow incoming data from our authorized authenticator proxy
				if( !/^https?:\/\/jamesbarnsley\.co\.nz/.test(event.origin) )
					return false;
				
				// convert to json
				var data = JSON.parse(event.data);
				
				console.info('Spotify authorization successful');
				
				// take our returned data, and save it to our localStorage
				$localStorage.spotify.AuthorizationCode = data.authorization_code;
				$localStorage.spotify.AccessToken = data.access_token;
				$localStorage.spotify.RefreshToken = data.refresh_token;
				$rootScope.spotifyOnline = true;
				this.authenticationMethod = 'client';
				
				// get my details and store 'em
				service.getMe()
					.then( function(response){
						SettingsService.setSetting('spotifyuser', response);
						$rootScope.$broadcast('spotmop:spotify:authenticationChanged', this.authenticationMethod);
					});
				
			}, false);
			
			
			/**
			 * The real starter
			 **/
			if( this.isAuthorized() ){
				$rootScope.spotifyAuthorized = true;
				this.authenticationMethod = 'client';
			}else{
				SettingsService.setSetting('spotifyuser', false);
				$rootScope.spotifyAuthorized = false;
				this.authenticationMethod = 'server';
			}
			
			$rootScope.$broadcast('spotmop:spotify:online');
		},
		
		logout: function(){
			$localStorage.spotify = {};
			this.authenticationMethod = 'server';
			this.refreshToken();
			$rootScope.$broadcast('spotmop:spotify:authenticationChanged', this.authenticationMethod);
		},
		
		/**
		 * Authorize this Spotmop instance with a Spotify account
		 * This is only needed once (in theory) for this account on this device. It is used to acquire access tokens (which expire)
		 **/
		authorize: function(){
			var frame = $(document).find('#authorization-frame');
			frame.attr('src', '//jamesbarnsley.co.nz/spotmop.php?action=authorize&app='+location.protocol+'//'+window.location.host );
		},
		
		isAuthorized: function(){
			if( $localStorage.spotify.AuthorizationCode && $localStorage.spotify.RefreshToken )
				return true;
			return false;
		},
		
		/**
		 * Refresh our access_token. There are two ways we can achieve this:
		 *		1. Client has authorized Spotmop by "Connecting to Spotify" for maximum features
		 *		2. Use config of backend to generate access_tokens for basic authentication
		 **/
        refreshToken: function(){
			
            var deferred = $q.defer();
			var url = '';
			
			// sweet, client has authorized interface!
			if( this.authenticationMethod == 'client' ){
			
				url = '//jamesbarnsley.co.nz/spotmop.php?action=refresh&refresh_token='+$localStorage.spotify.RefreshToken;
			
			// client hasn't authorized spotmop with spotify, so let's just use the backend
			}else if( this.authenticationMethod == 'server' ){
				
				var mopidyhost = SettingsService.getSetting("mopidy.host");
				if( !mopidyhost ) mopidyhost = window.location.hostname;
				var mopidyport = SettingsService.getSetting("mopidy.port");
				if( !mopidyport ) mopidyport = "6680";
				url = '//'+mopidyhost+':'+mopidyport+'/spotmop/auth';
			
			// no authentication method, so cannot refresh token!
			}else{
				return false;
			}
			
            $http({
					method: 'GET',
					url: url,
					dataType: "json",
					async: false,
					timeout: 10000
				})
                .success(function( response ){
					
					// check for error response
					if( typeof(response.error) !== 'undefined' ){
						NotifyService.error('Spotify authorization error: '+response.error_description);
						$rootScope.spotifyOnline = false;
						deferred.reject( response.error.message );
					}else{
						$localStorage.spotify.AccessToken = response.access_token;
						$localStorage.spotify.AccessTokenExpiry = new Date().getTime() + 3600000;
						$rootScope.spotifyOnline = true;					
						deferred.resolve( response );
					}
                });
				
            return deferred.promise;
        },
		
		/** 
		 * Request error 
		 * When a request fails, but not due to authorization (ie 504, 503, etc). This is just a nifty alias to notify the user.
		 **/
		serviceUnavailable: function(){
			NotifyService.error('Request failed. Spotify API may be temporarily unavailable.');
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
		 * Identify what kind of asset a URI is (playlist, album, etc)
		 * @param uri = string
		 * @return string
		 **/
		uriType: function( uri ){
			var exploded = uri.split(':');
			if( exploded[0] == 'spotify' && exploded[1] == 'track' )
				return 'track';	
			if( exploded[0] == 'spotify' && exploded[1] == 'artist' )
				return 'artist';		
			if( exploded[0] == 'spotify' && exploded[1] == 'album' )
				return 'album';		
			if( exploded[0] == 'spotify' && exploded[1] == 'user' && exploded[3] == 'playlist' )
				return 'playlist';		
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
					
					NotifyService.error(response.error.message);
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
        /**
         * Users
         **/
        
        getMe: function(){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
        getUser: function( useruri ){
		
			var userid = this.getFromUri( 'userid', useruri );
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: urlBase+'users/'+userid
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
		
		isFollowing: function( type, uri ){
			
			var id = this.getFromUri( type+'id', uri );			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					
					NotifyService.error( response.error.message );
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
					url: urlBase+'tracks/'+trackid
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					NotifyService.error( response.error.message );
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
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

            $http({
					method: 'GET',
					url: urlBase+'me/tracks/?limit=50',
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		}, 
		
		addTracksToLibrary: function( trackids ){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}
			
			// firstly, let's invalidate the cache (because we've changed the resource)
			var httpCache = $cacheFactory.get('$http');
			httpCache.remove( urlBase+'me/tracks/?limit=50' );

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
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		addAlbumsToLibrary: function( albumids ){
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}
			
			// firstly, let's invalidate the album request cache (because we've changed the resource)
			var httpCache = $cacheFactory.get('$http');
			httpCache.remove( urlBase+'me/albums?limit=40&offset=0' );
			
            var deferred = $q.defer();
			if( typeof(albumids) !== 'array' )
				albumids = [albumids];
			
            $http({
					method: 'PUT',
					url: urlBase+'me/albums',
					dataType: "json",
					data: JSON.stringify( { ids: albumids } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		removeAlbumsFromLibrary: function( albumids ){
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}
			
            var deferred = $q.defer();
			if( typeof(albumids) !== 'array' )
				albumids = [albumids];
			
            $http({
					method: 'DELETE',
					url: urlBase+'me/albums',
					dataType: "json",
					data: JSON.stringify( { ids: albumids } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		deleteTracksFromLibrary: function( trackids ){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}
			
			// firstly, let's invalidate the cache (because we've changed the resource)
			var httpCache = $cacheFactory.get('$http');
			httpCache.remove( urlBase+'me/tracks/?limit=50' );

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
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getMyArtists: function( userid ){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getMyAlbums: function( userid, limit, offset ){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}
			
			if( typeof( limit ) === 'undefined' || !limit ) limit = 20;
			if( typeof( offset ) === 'undefined' ) offset = 0;

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'me/albums?limit='+limit+'&offset='+offset,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){	
					deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		isFollowingArtist: function( artisturi, userid ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		followArtist: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );	
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		unfollowArtist: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
	
		/**
		 * Get one or many tracks
		 * @param trackids = string (comma-separated ids)
		 **/		
		getTracks: function( trackids ){
				
            var deferred = $q.defer();

            $http({
					cache: false,
					method: 'GET',
					url: urlBase+'tracks?ids='+trackids,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		isFollowingPlaylist: function( playlisturi, ids ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		followPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		unfollowPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		featuredPlaylists: function( limit ){
			
			if( typeof( limit ) === 'undefined' )
				limit = 40;
			
			var timestamp = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss');
			var country = SettingsService.getSetting('spotify.countrycode');
			if( !country ) country = 'NZ';
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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		addTracksToPlaylist: function( playlisturi, tracks ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		movePlaylistTracks: function( playlisturi, range_start, range_length, insert_before ){
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}	
            
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
            
			spotifyUser = SettingsService.getSetting('spotifyuser');
            if( !spotifyUser || userid != spotifyUser.id ) return false;		
			
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
                    console.log( response );
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		deleteTracksFromPlaylist: function( playlisturi, snapshotid, positions ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
            var deferred = $q.defer();
			
            $http({
					method: 'DELETE',
					url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
					dataType: "json",
					data: JSON.stringify( { snapshot_id: snapshotid, positions: positions } ),
					contentType: "application/json; charset=utf-8",
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		// create a new playlist
		// @param userid id of the user to own this playlist (usually self)
		// @param data json array {name: "Name", public: boolean}
		createPlaylist: function( userid, data ){
			
            var deferred = $q.defer();
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
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
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		/**
		 * Discover
		 **/
		newReleases: function( limit, offset ){
			
			if( typeof( limit ) === 'undefined' || !limit ) limit = 40;
			if( typeof( offset ) === 'undefined' ) offset = 0;
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'browse/new-releases?country='+ country +'&limit='+limit+'&offset='+offset,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){	
					
					var readyToResolve = false;
					var completeAlbums = [];
					var batchesRequired = Math.ceil( response.albums.items.length / 20 );
					
					// batch our requests - Spotify only allows a max of 20 albums per request, d'oh!
					for( var batchCounter = 0; batchCounter < batchesRequired; batchCounter++ ){
						
						var batch = response.albums.items.splice(0,20);
						var albumids = [];
						
						// loop all our albums to build a list of all the album ids we need
						for( var i = 0; i < batch.length; i++ ){
							albumids.push( batch[i].id );
						};
						
						// go get the albums
						service.getAlbums( albumids )
							.then( function(albums){
								completeAlbums = completeAlbums.concat( albums );									
								if( batchCounter >= batchesRequired ){
									response.albums.items = completeAlbums;
									deferred.resolve( response );
								}
							});
					}		
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		browseCategories: function( limit ){
			
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		
		/**
		 * Top content and recommendations
		 * This is Spotify's merger with EchoNest
		 **/
		
		getMyFavorites: function( type, limit, offset, time_range ){
			
			if( typeof( limit ) === 'undefined' || !limit ) 			var limit = 25;
			if( typeof( offset ) === 'undefined' || !offset )			var offset = 0;
			if( typeof( time_range ) === 'undefined' || !time_range ) 	var time_range = 'long_term';
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'me/top/'+type+'?limit='+limit+'&offset='+offset+'&time_range='+time_range,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getRecommendations: function( limit, offset, seed_artists, seed_albums, seed_tracks ){
			
			var url = urlBase+'recommendations/?';
			
			if( typeof( limit ) !== 'undefined' && limit ) 					url += 'limit='+limit;
			if( typeof( offset ) !== 'undefined'&& offset ) 				url += '&offset='+offset;
			if( typeof( seed_artists ) !== 'undefined'&& seed_artists ) 	url += '&seed_artists='+seed_artists;
			if( typeof( seed_albums ) !== 'undefined'&& seed_albums ) 		url += '&seed_albums='+seed_albums;
			if( typeof( seed_tracks ) !== 'undefined'&& seed_tracks ) 		url += '&seed_tracks='+seed_tracks;
			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: url,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
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
					url: urlBase+'artists/'+artistid
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		 
		getArtists: function( artistids ){
			
            var deferred = $q.defer();
            
            var readyToResolve = false;
            var completeArtists = [];
            var batchesRequired = Math.ceil( artistids.length / 20 );
            
            // batch our requests - Spotify only allows a max of 20 artist ids per request, d'oh!
            for( var batchCounter = 1; batchCounter <= batchesRequired; batchCounter++ ){
                
                var batch = artistids.splice(0,20);
                
                var artistids_string = '';
                for( var i = 0; i < batch.length; i++ ){
                    if( i > 0 ) artistids_string += ','
                    artistids_string += batch[i];
                }

                $http({
                        cache: true,
                        method: 'GET',
                        url: urlBase+'artists?ids='+artistids_string+'&market='+country
                    })
                    .success(function( response ){
                        completeArtists = completeArtists.concat( response.artists );						
                        if( batchCounter >= batchesRequired ){
                            deferred.resolve( completeArtists );
                        }
                    })
                    .error(function( response ){					
                        NotifyService.error( response.error.message );
                        deferred.reject( response.error.message );
                    });
            }		
				
            return deferred.promise;
		},
		
		getTopTracks: function( artisturi ){
		
			var artistid = this.getFromUri( 'artistid', artisturi );			
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid+'/top-tracks?country='+country
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					NotifyService.error( response.error.message );
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
					url: urlBase+'artists/'+artistid+'/related-artists'
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		
		/** 
		 * Albums
		 **/
		
		getAlbum: function( albumuri ){
						
            var deferred = $q.defer();			
			var albumid = this.getFromUri( 'albumid', albumuri );

            $http({
					method: 'GET',
					url: urlBase+'albums/'+albumid
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		getAlbums: function( albumids ){
			
            var deferred = $q.defer();
            
            var readyToResolve = false;
            var completeAlbums = [];
            var batchesRequired = Math.ceil( albumids.length / 20 );
			
            // batch our requests - Spotify only allows a max of 20 albums per request, d'oh!
            for( var batchCounter = 0; batchCounter < batchesRequired; batchCounter++ ){
                
                var batch = albumids.splice(0,20);
                
                var albumids_string = '';
                for( var i = 0; i < batch.length; i++ ){
                    if( i > 0 ) albumids_string += ','
                    albumids_string += batch[i];
                }

                $http({
                        cache: true,
                        method: 'GET',
                        url: urlBase+'albums?ids='+albumids_string+'&market='+country
                    })
                    .success(function( response ){
                        completeAlbums = completeAlbums.concat( response.albums );												
                        if( batchCounter >= batchesRequired ){
                            deferred.resolve( completeAlbums );
                        }
                    })
                    .error(function( response ){					
                        NotifyService.error( response.error.message );
                        deferred.reject( response.error.message );
                    });
            }		
				
            return deferred.promise;
		},
		
		getArtistAlbums: function( artisturi ){
			
			var artistid = this.getFromUri( 'artistid', artisturi );
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'artists/'+artistid+'/albums?album_type=album,single&market='+country
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		},
		
		isAlbumInLibrary: function( albumids ){
			
            var deferred = $q.defer();
			
			var albumids_string = '';
			for( var i = 0; i < albumids.length; i++ ){
				if( i > 0 )
					albumids_string += ','
				albumids_string += albumids[i];
			}
			
			if( !this.isAuthorized() ){
                deferred.reject();
				return deferred.promise;
			}

            $http({
					method: 'GET',
					url: urlBase+'me/albums/contains?ids='+albumids_string,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){
					
                    deferred.resolve( response );
                })
                .error(function( response ){
					
					NotifyService.error( response.error.message );
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
		getSearchResults: function( type, query, limit, offset ){
		
			if( typeof( limit ) === 'undefined' ) limit = 10;
			if( typeof( offset ) === 'undefined' ) offset = 0;
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'search?q='+query+'&type='+type+'&country='+country+'&limit='+limit+'&offset='+offset,
					headers: {
						Authorization: 'Bearer '+ $localStorage.spotify.AccessToken
					}
				})
                .success(function( response ){		
					
					if( type == 'album' ){
						
						var readyToResolve = false;
						var completeAlbums = [];
						var batches = [];
						
						// batch our requests - Spotify only allows a max of 20 albums per request, d'oh!
						while( response.albums.items.length ){
							batches.push( response.albums.items.splice(0,20) );
						}
						
						// now let's process our batches
						for( var i = 0; i < batches.length; i++ ){
							
							// loop our batch items to get just IDs
							var albumids = [];							
							for( var j = 0; j < batches[i].length; j++ ){
								albumids.push( batches[i][j].id );
							};
							
							// go get the albums
							service.getAlbums( albumids )
								.then( function(albums){
									completeAlbums = completeAlbums.concat( albums.albums );									
									if( i >= batches.length - 1 ){
										response.albums.items = completeAlbums;
										deferred.resolve( response );
									}
								});
						}
						
					}else{
						deferred.resolve( response );
					}
					
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		}
	};
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	var country = SettingsService.getSetting("spotify.country");
	if( !country ) country = 'NZ';
	var locale = SettingsService.getSetting("spotify.locale");
	if( !locale ) locale = 'en_NZ';
	
	// and finally, give us our service!
	return service;
}])



/**
 * Authentication Intercepter which checks spotify's requests results for a 401 error
 * SOURCE: https://github.com/dirkgroenen
 **/
.factory('SpotifyServiceIntercepter', function SpotifyServiceIntercepter($q, $rootScope, $injector, $localStorage){ 

    "use strict";
	var retryCount = 0;
	
	/**
	 * Retry an originating request
	 * Used when re-authentication has occured, and we're ready to try with new details
	 **/
	function retryHttpRequest(config, deferred, newAccessToken){
		function successCallback(response){
			deferred.resolve(response);
		}
		function errorCallback(response){
			deferred.reject(response);
		}
		var $http = $injector.get('$http');
		
		// replace the access token with our new one
		config.headers = { Authorization: 'Bearer '+ newAccessToken };
		
		// run the original request, which will then return the original callbacks
		$http(config).then(successCallback, errorCallback);
	}
	
	
	/**
	 * Response interceptor object
	 **/
    var interceptor = {	
		responseError: function( response ){
			
			// check that it is a spotify request, and not a failed token request
			// also limit to 3 retries
			if( response.config.url.search('https://api.spotify.com/') >= 0 && retryCount < 3 ){
			
				// permission denied
				if( response.status == 401 ){
						
					retryCount++;
					var deferred = $q.defer();
					
					// refresh the token
					$injector.get('SpotifyService').refreshToken()
						.then( function(refreshResponse){
							
							// make sure our refresh request didn't error, otherwise we'll create an infinite loop
							if( typeof(refreshResponse.error) !== 'undefined' )
								return response;
								
							retryCount--;
							
							// now retry the original request
							retryHttpRequest( response.config, deferred, refreshResponse.access_token );
						});
					
					return deferred.promise;
				
				// misc error
				}else if( response.status == 0 ){						
					var deferred = $q.defer();
					$injector.get('SpotifyService').serviceUnavailable();				
					return deferred.promise;				
				}			
			}
			
			return response;
		}
    };

    return interceptor;
});










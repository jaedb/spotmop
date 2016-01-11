/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.spotify', [])

.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', '$filter', '$q', 'SettingsService', 'NotifyService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, $filter, $q, SettingsService, NotifyService ){
	
	// setup response object
    var service = {
		
		start: function(){
	
			// inject our authorization frame, on the placeholder action
			var frame = $('<iframe id="authorization-frame" style="width: 1px; height: 1px; display: none;" src="http://jamesbarnsley.co.nz/spotmop.php?action=frame"></iframe>');
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
			
			// setup automatic refreshing (tokens last for 3600 seconds = 1 hour, so let's refresh every 3500 seconds = 59 minutes)
			$interval( service.refreshToken, 3500000 );
			
			// listen for incoming messages from the authorization iframe
			window.addEventListener('message', function(event){
				
				// only allow incoming data from our authorized authenticator proxy
				if( event.origin !== "http://jamesbarnsley.co.nz" )
					return false;
				
				// convert to json
				var data = JSON.parse(event.data);
				
				console.info('Spotify authorization successful');
				
				// take our returned data, and save it to our localStorage
				$localStorage.spotify.AuthorizationCode = data.authorization_code;
				$localStorage.spotify.AccessToken = data.access_token;
				$localStorage.spotify.RefreshToken = data.refresh_token;
				$rootScope.spotifyOnline = true;
				$rootScope.$broadcast('spotmop:spotify:online');
			}, false);
			
			
			/**
			 * The real starter
			 **/
			if( this.isAuthorized() ){
				// on start, get a new token
				// this means we [easily] know how long it's been since last refreshed
				this.refreshToken();
				$rootScope.$broadcast('spotmop:spotify:online');
			}else{
				this.authorize();
			}
		},
		
		logout: function(){
			$localStorage.spotify = {};
			$rootScope.spotifyOnline = false;
		},
		
		/**
		 * Authorize this Spotmop instance with a Spotify account
		 * This is only needed once (in theory) for this account on this device. It is used to acquire access tokens (which expire)
		 **/
		authorize: function(){
			var frame = $(document).find('#authorization-frame');
			frame.attr('src', 'http://jamesbarnsley.co.nz/spotmop.php?action=authorize&app='+location.protocol+'//'+window.location.host );
		},
		
		isAuthorized: function(){
			if( $localStorage.spotify.AuthorizationCode && $localStorage.spotify.RefreshToken )
				return true;
			return false;
		},
		
		/**
		 * Refresh our existing credentials, by parsing our Authorization refresh_token
		 **/
        refreshToken: function(){
			
            var deferred = $q.defer();

            $http({
					method: 'GET',
					url: 'http://jamesbarnsley.co.nz/spotmop.php?action=refresh&refresh_token='+$localStorage.spotify.RefreshToken,
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
					url: urlBase+'users/'+userid,
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
					url: urlBase+'tracks/'+trackid,
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
					
					NotifyService.error( response.error.message );
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
					
					NotifyService.error( response.error.message );
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
					
					NotifyService.error( response.error.message );
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
					
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					NotifyService.error( response.error.message );
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
					url: urlBase+'artists/'+artistid+'/related-artists',
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
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
		}
	};
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	var country = SettingsService.getSetting("spotifycountry", 'NZ');
	var locale = SettingsService.getSetting("spotifylocale", "en_NZ");
	
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
	function retryHttpRequest(config, deferred){
		function successCallback(response){
			deferred.resolve(response);
		}
		function errorCallback(response){
			deferred.reject(response);
		}
		var $http = $injector.get('$http');
		$http(config).then(successCallback, errorCallback);
	}
	
	
	/**
	 * Response interceptor object
	 **/
    var interceptor = {	
		responseError: function( response ){
			
			// check that it is a spotify request, and not a failed token request
			if( response.status == 401 && response.config.url.search('https://api.spotify.com/') >= 0 && retryCount < 3 ){
					
				retryCount++;
				var deferred = $q.defer();				
				
				// if we're already authorized, we just need to force a token refresh
				if( $injector.get('SpotifyService').isAuthorized() ){
				
					// refresh the token
					$injector.get('SpotifyService').refreshToken()
						.then( function(refreshResponse){
							
							// make sure our refresh request didn't error, otherwise we'll create an infinite loop
							if( typeof(refreshResponse.error) !== 'undefined' )
								return response;
								
							console.log('Successfully refreshed token. Now sending original request');		
							retryCount--;
							
							// now retry the original request
							retryHttpRequest( response.config, deferred );
						});
					
					return deferred.promise;
		
				// not yet authorized, so authorize!
				// this requires user interaction, so let's just allow the original request to fail
				}else{
					
					// remove our current authorization, just to clear the decks
					$localStorage.spotify = {};
					$rootScope.spotifyOnline = false;
					
					// and re-authorize
					$injector.get('SpotifyService').authorize();	
					retryCount--;
					return response;
				}
			}
			
			return response;
		}
    };

    return interceptor;
});










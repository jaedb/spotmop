/**
 * Playlists manager servce
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.playlistManager', [])

.factory("PlaylistManagerService", ['$rootScope', '$resource', '$localStorage', '$http', '$filter', '$q', 'SettingsService', 'NotifyService', 'MopidyService', 'SpotifyService', function( $rootScope, $resource, $localStorage, $http, $filter, $q, SettingsService, NotifyService, MopidyService, SpotifyService ){
    
	$rootScope.$on('spotmop:playlists:changed', function( event, data ){
		service.refreshPlaylists();
	});
    
	var playlists = [];
	var myPlaylists = [];

	// setup response object
    var service = {
        playlists: function(){
            return playlists;
        },
        myPlaylists: function(){
            return myPlaylists;
        },
        addToPlaylists: function(playlist){
            playlists.push( playlist );
            service.refreshMyPlaylists();
        },
        refreshMyPlaylists: function(){
            myPlaylists = [];
            for( var i = 0; i < playlists.length; i++ ){
                var playlist = playlists[i];
                var origin = $filter('assetOrigin')(playlist.uri);
                if( origin == 'spotify' ){
                    var user = SettingsService.getSetting('spotifyuser.id');
                    if( $rootScope.spotifyAuthorized && playlist.uri.startsWith('spotify:user:'+user) ){
                        myPlaylists.push( playlist );
                    }
                }else{
                    myPlaylists.push( playlist );
                }
            }
        },
		refreshPlaylist: function( uri ){
			// lookup playlist in our playlist array, and update data
			// this will be called when a playlist has been modified
		},
        refreshPlaylists: function(){
			MopidyService.getPlaylists()
				.then( function( response ){
                    
                    // store our playlist references for now
					playlists = response;
                    
                    // if we've got a userid already in storage, use that
                    var userid = SettingsService.getSetting('spotifyuser.id');
                    
                    // now go get the extra info (and artwork) from Spotify
                    // need to do this individually as there is no bulk endpoint, curses!
                    angular.forEach( playlists, function(playlist, i){
                        
                        // only lookup Spotify playlists
                        if( playlist.uri.startsWith('spotify:') ){
                            
                            // process it and add to our $scope
                            var callback = function(i){
                                return function( response ){
                                    
                                    // make sure our response was not an error
                                    if( typeof(response.error) === 'undefined' ){
                                        
                                        // update the existing playlist item with our updated data
                                        playlists[i] = response;
                                        
                                        service.refreshMyPlaylists();
                                    }
                                };
                            }(i);
                            
                            // run the actual request
                            SpotifyService.getPlaylist( playlist.uri ).then( callback );
                        }
                    });
				});
        },
		addTracksToPlaylist: function( uri, trackUris ){
		
			var trackUrisToAdd = [];
			var trackUrisExcluded = 0;
			var playlistUriScheme = $filter('assetOrigin')( uri );
			
			// Loop all our selected tracks to build a uri array
			angular.forEach( trackUris, function(trackUri){
				
				// If we're adding to a m3u playlist, add whatever ya want
				if( playlistUriScheme == 'm3u' ){
					trackUrisToAdd.push( trackUri );
				
				// Adding to a different provider (ie spotify, soundcloud)
				// so we can  only add items from said provider
				}else{
					if( $filter('assetOrigin')( trackUri ) == playlistUriScheme ){
						trackUrisToAdd.push( trackUri );
					}else{
						trackUrisExcluded++;
					}						
				}
			});
				
			// Notify user if we omitted any tracks
			if( trackUrisExcluded > 0 ){
				if( trackUrisToAdd.length <= 0 ){
					NotifyService.error( 'No tracks could to be added to playlist' );
					return false;
				}else{
					NotifyService.error( trackUrisExcluded+' tracks not added to playlist' );
				}
			}
			
			// now add them to the playlist, for reals
			switch(playlistUriScheme){
				case 'spotify':
					SpotifyService.addTracksToPlaylist( uri, trackUrisToAdd )
						.then( function(response){
							NotifyService.notify('Added '+trackUrisToAdd.length+' tracks to playlist');
							
							// TODO: service.refreshPlaylist( uri );
						});
					break;
				case 'm3u':
					MopidyService.addTracksToPlaylist( uri, trackUrisToAdd )
						.then( function(response){
							NotifyService.notify('Added '+trackUrisToAdd.length+' tracks to playlist');
							
							// TODO: service.refreshPlaylist( uri );
						});
					break;
				default:
					NotifyService.error( 'Playlist scheme '+playlistUriScheme+' not supported' );
					break;
			}
		},
		deleteTracksFromPlaylist: function(uri, indexes, snapshot_id){
			
		    var deferred = $q.defer();
			var playlistUriScheme = $filter('assetOrigin')( uri );
			
			// now delete them from the playlist, for reals
			switch(playlistUriScheme){
				case 'spotify':
		
					var playlistOwnerID = SpotifyService.getFromUri('userid', uri);
					var currentUserID = SettingsService.getSetting('spotifyuser.id');
					
					if( playlistOwnerID != currentUserID ){
						NotifyService.error('Cannot modify to a playlist you don\'t own');
						return false;
					}

					// parse these uris to spotify and delete these tracks
					SpotifyService.deleteTracksFromPlaylist( uri, snapshot_id, indexes )
						.then( function(response){
						
								if( typeof(response.error) !== 'undefined' ){
									NotifyService.error( response.error.message );
									deferred.reject( response.error.message );									
								}else{		
									NotifyService.notify('Removed '+indexes.length+' tracks from playlist');
									deferred.resolve({ type: playlistUriScheme, indexes: indexes, snapshot_id: response.snapshot_id });
								}
							});
					break;
				case 'm3u':
					MopidyService.deleteTracksFromPlaylist( uri, indexes )
						.then( function(response){
							NotifyService.notify('Removed '+indexes.length+' tracks from playlist');
							deferred.resolve({ type: playlistUriScheme, playlist: response });
						});
					break;
				default:
					NotifyService.error( 'Playlist scheme '+playlistUriScheme+' not supported' );
					deferred.reject();	
					break;
			}
				
            return deferred.promise;
		}
	};
	
	// and finally, give us our service!
	return service;
}]);










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
    
    var state = {
        playlists: [],
        myPlaylists: []
    }

	// setup response object
    var service = {
        state: function(){
            return state;
        },
        addToPlaylists: function(playlist){
            state.playlists.push( playlist );
            service.refreshMyPlaylists();
        },
        refreshMyPlaylists: function(){
            state.myPlaylists = [];
            for( var i = 0; i < state.playlists.length; i++ ){
                var playlist = state.playlists[i];
                var origin = $filter('assetOrigin')(playlist.uri);
                if( origin == 'spotify' ){
                    var user = SettingsService.getSetting('spotifyuser.id');
                    if( $rootScope.spotifyAuthorized && playlist.uri.startsWith('spotify:user:'+user) ){
                        state.myPlaylists.push( playlist );
                    }
                }else{
                    state.myPlaylists.push( playlist );
                }
            }
        },
        refreshPlaylists: function(){
			MopidyService.getPlaylists()
				.then( function( response ){
                    
                    // store our playlist references for now
					state.playlists = response;
                    
                    // if we've got a userid already in storage, use that
                    var userid = SettingsService.getSetting('spotifyuser.id');
                    
                    // now go get the extra info (and artwork) from Spotify
                    // need to do this individually as there is no bulk endpoint, curses!
                    angular.forEach( state.playlists, function(playlist, i){
                        
                        // only lookup Spotify playlists
                        if( playlist.uri.startsWith('spotify:') ){
                            
                            // process it and add to our $scope
                            var callback = function(i){
                                return function( response ){
                                    
                                    // make sure our response was not an error
                                    if( typeof(response.error) === 'undefined' ){
                                        
                                        // update the existing playlist item with our updated data
                                        state.playlists[i] = response;
                                        
                                        service.refreshMyPlaylists();
                                    }
                                };
                            }(i);
                            
                            // run the actual request
                            SpotifyService.getPlaylist( playlist.uri ).then( callback );
                        }
                    });
				});
        }
	};
	
	// and finally, give us our service!
	return service;
}]);










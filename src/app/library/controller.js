angular.module('spotmop.library', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('library', {
			url: "/library",
			templateUrl: "app/library/template.html"
		})
		.state('library.playlists', {
			url: "/playlists",
			templateUrl: "app/library/playlists.template.html",
			controller: 'LibraryPlaylistsController'
		})
		.state('library.playlist', {
			url: "/playlist/:uri",
			templateUrl: "app/browse/playlist/template.html",
			controller: 'PlaylistController'
		})
		.state('library.tracks', {
			url: "/tracks",
			templateUrl: "app/library/tracks.template.html",
			controller: 'LibraryTracksController'
		})
		.state('library.artists', {
			url: "/artists",
			templateUrl: "app/library/artists.template.html",
			controller: 'LibraryArtistsController'
		})
		.state('library.albums', {
			url: "/albums",
			templateUrl: "app/library/albums.template.html",
			controller: 'LibraryAlbumsController'
		});
})
	
/**
 * Library tracks
 **/
.controller('LibraryTracksController', function LibraryTracksController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	  
	$scope.tracklist = {tracks: [], type: 'track'};
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
    
	SpotifyService.getMyTracks( userid )
		.then( function( response ){ // successful
				$scope.tracklist = response;
				$scope.tracklist.tracks = reformatTracks( response.items );
				
				// if it was 401, refresh token
				if( typeof(response.error) !== 'undefined' && response.error.status == 401 )
					Spotify.refreshToken();
			});
		
		
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		var tracksToDelete = [];
		
		// construct each track into a json object to delete
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( SpotifyService.getFromUri( 'trackid', selectedTrack.uri ) );
		});
		
		// parse these uris to spotify and delete these tracks
		SpotifyService.deleteTracksFromLibrary( tracksToDelete )
			.then(function( response ){
				
				// filter the playlist tracks to exclude all selected tracks (because we've just deleted them)
				// we could fetch a new version of the tracklist from Spotify, but that isn't really necessary
				$scope.tracklist.tracks = $filter('filter')($scope.tracklist.tracks, { selected: false });
			});
	});
	
		
	/**
	 * Reformat the track structure to the unified tracklist.track
	 * Need to strip wrapping track object
	 **/
	function reformatTracks( tracks ){
		
		var reformattedTracks = [];
		
		// loop all the tracks to add
		angular.forEach( tracks, function( track ){
			var newTrack = track.track;
			newTrack.added_at = track.added_at;
			reformattedTracks.push( newTrack );
		});
		
		return reformattedTracks;
	}
    
	
    /**
     * Load more of the album's tracks
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreTracks = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreTracks( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreTracks = true;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.tracklist.tracks = $scope.tracklist.tracks.concat( reformatTracks( response.items ) );
                
                // save the next set's url (if it exists)
                $scope.tracklist.next = response.next;
                
                // update loader and re-open for further pagination objects
                loadingMoreTracks = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && typeof( $scope.tracklist.next ) !== 'undefined' && $scope.tracklist.next ){
            loadMoreTracks( $scope.tracklist.next );
        }
	});
	
})
	
/**
 * Library artists
 **/
.controller('LibraryArtistsController', function ( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	
	$scope.settings = SettingsService.getSettings();
	$scope.viewOptions = [
			{
				value: 'grid',
				label: 'Grid'
			},
			{
				value: 'list',
				label: 'List'
			}
		];
	$scope.sortOptions = [
			{
				value: '',
				label: 'Default'
			},
			{
				value: 'name',
				label: 'Name'
			},
			{
				value: 'genres[0]',
				label: 'Genres'
			},
			{
				value: 'followers.total',
				label: 'Followers'
			}
		];
	
	$scope.artists = [];
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
    
	SpotifyService.getMyArtists( userid )
		.then( function( response ){ // successful
				$scope.artists = response.artists;
				console.log( response.artists );
				// if it was 401, refresh token
				if( typeof(response.error) !== 'undefined' && response.error.status == 401 )
					Spotify.refreshToken();
			});
    
	
    /**
     * Load more of my artists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreItems = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreItems( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreItems = true;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
			
                // append these new items
                $scope.artists.items = $scope.artists.items.concat( response.artists.items );
                
                // save the next set's url (if it exists)
                $scope.artists.next = response.artists.next;
                
                // update loader and re-open for further pagination objects
                loadingMoreItems = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreItems && typeof( $scope.artists.next ) !== 'undefined' && $scope.artists.next ){
            loadMoreItems( $scope.artists.next );
        }
	});
		
})

/**
 * Library albums
 **/
.controller('LibraryAlbumsController', function ( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService, MopidyService, NotifyService ){
	
	$scope.settings = SettingsService.getSettings();
	$scope.viewOptions = [
			{
				value: 'detail',
				label: 'Detail'
			},
			{
				value: 'grid',
				label: 'Grid'
			},
			{
				value: 'list',
				label: 'List'
			}
		];
	$scope.sortOptions = [
			{
				value: '',
				label: 'Default'
			},
			{
				value: 'album.name',
				label: 'Title'
			},
			{
				value: 'album.artists[0].name',
				label: 'Artist'
			},
			{
				value: 'album.added_at',
				label: 'Date added'
			}
		];
	$scope.albums = { items: [] };
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuser.id');
	
	// if we have full spotify authorization
	if( $rootScope.spotifyAuthorized ){	
    
		SpotifyService.getMyAlbums( userid )
			.then( function( response ){				
					$scope.albums = response;
				});
	}
	
	// play a whole album
	$scope.playAlbum = function( album ){
		MopidyService.playStream( album.uri );
	}
	
	// remove album from library
	$scope.removeFromLibrary = function( album ){
		album.transitioning = true;
		
		SpotifyService.removeAlbumsFromLibrary( album.id )
			.then( function(response){
				if( typeof(response.error) === 'undefined' ){
					$scope.albums.items.splice( $scope.albums.items.indexOf(album), 1 );
				}else{
					NotifyService.error( response.error.message );
					album.transitioning = false;
				}
			});
	}
	
    /**
     * Load more of the album's tracks
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreAlbums = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreAlbums( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreAlbums = true;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.albums.items = $scope.albums.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.next;
                
                // update loader and re-open for further pagination objects
                loadingMoreAlbums = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreAlbums && typeof( $scope.albums.next ) !== 'undefined' && $scope.albums.next ){
            loadMoreAlbums( $scope.albums.next );
        }
	});
})



/**
 * Library playlists
 **/
.controller('LibraryPlaylistsController', function PlaylistsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService, MopidyService, NotifyService ){
	
	// note: we use the existing playlist list to show playlists on this page	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
	
	$scope.settings = SettingsService.getSettings();
	$scope.filterOptions = [
			{
				value: 'all',
				label: 'All playlists'
			},
			{
				value: 'owned',
				label: 'Playlists I own'
			}
		];
	$scope.viewOptions = [
			{
				value: 'grid',
				label: 'Grid'
			},
			{
				value: 'list',
				label: 'List'
			}
		];
	$scope.sortOptions = [
			{
				value: '',
				label: 'Default'
			},
			{
				value: 'name',
				label: 'Name'
			},
			{
				value: 'owner.id',
				label: 'Owner'
			},
			{
				value: 'tracks.total',
				label: 'Tracks'
			}
		];
	$scope.playlists = { items: [] };
	$scope.show = function( playlist ){
        var filter = SettingsService.getSetting('playlists.filter');
        if( !filter || filter == 'all' ){
			return true;
        }
        
        if( playlist.owner.id == 'jaedb' ) return true;
		
		return false;
	};
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuser.id');
	
	// if we have full spotify authorization
	if( $rootScope.spotifyAuthorized ){	
    
		SpotifyService.getPlaylists( userid )
			.then( function( response ){ // successful
					
					// if it was 401, refresh token
					if( typeof(response.error) !== 'undefined' && response.error.status == 401 ){
						Spotify.refreshToken();
                    }else{
						$scope.playlists = response;
					}
				});
	
	// not authorized, so have to fetch via backend first
	}else{
        
		function fetchPlaylists(){		
			MopidyService.getPlaylists()
				.then( function( response ){
					
					// add them to our list
					$scope.playlists.items = response;
					
					// now go get the extra info (and artwork) from Spotify
					// need to do this individually as there is no bulk endpoint, curses!
					angular.forEach( response, function(playlist, i){
					
						// process it and add to our $scope
						var callback = function(i){
							return function( response ){
								
								// make sure our response was not an error
								if( typeof(response.error) === 'undefined' ){
									
									// update the existing playlist item with our updated data
									$scope.playlists.items[i] = response;
								}
							};
						}(i);
						
						// run the actual request
						SpotifyService.getPlaylist( playlist.uri ).then( callback );
					});
				});
		}
		
		// on load of this page (whether first pageload or just a new navigation)
		if( $rootScope.mopidyOnline )
			fetchPlaylists();
		else
			$scope.$on('mopidy:state:online', function(){ fetchPlaylists(); });
    }
	
	
    /**
     * Load more of the album's tracks
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMorePlaylists = false;
    
    // go off and get more of this playlist's tracks
    function loadMorePlaylists( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMorePlaylists = true;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.playlists.items = $scope.playlists.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.playlists.next = response.next;
                
                // update loader and re-open for further pagination objects
                loadingMorePlaylists = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMorePlaylists && typeof( $scope.playlists.next ) !== 'undefined' && $scope.playlists.next ){
            loadMorePlaylists( $scope.playlists.next );
        }
	});
});




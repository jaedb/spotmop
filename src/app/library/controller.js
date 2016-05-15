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
		})
		.state('library.files', {
			url: "/files/:folder",
			templateUrl: "app/library/files.template.html",
			controller: 'LibraryFilesController'
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
	
	$scope.artists = [];
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
    
	SpotifyService.getMyArtists( userid )
		.then( function( response ){ // successful
				$scope.artists = response.artists;
				
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
	$scope.albums = { items: [] };
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuser',{ id: null }).id;
	
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
	$scope.playlists = { items: [] };
	$scope.show = function( playlist ){
        
        if(
				typeof($scope.settings.playlists) === 'undefined' ||
				typeof($scope.settings.playlists.onlyshowowned) === 'undefined' ||
				!$scope.settings.playlists.onlyshowowned ){
            return true;
        }
        
        if( playlist.owner.id == 'jaedb' ) return true;
		
		return false;
	};
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuser',{ id: null }).id;
	
	// if we have full spotify authorization
	if( $rootScope.spotifyAuthorized ){	
    
		SpotifyService.getPlaylists( userid )
			.then( function( response ){ // successful
					$scope.playlists = response;
					
					// if it was 401, refresh token
					if( typeof(response.error) !== 'undefined' && response.error.status == 401 )
						Spotify.refreshToken();
				});
	
	// not authorized, so have to fetch via backend first
	}else{	
        
        NotifyService.notify('Fetching from Mopidy as you haven\'t authorized Spotify. This will take a while!');
        
		function fetchPlaylists(){		
			MopidyService.getPlaylists()
				.then( function( response ){				
					// fetch more detail from each playlist (individually, d'oh!)
					angular.forEach( response, function(value, key){
						SpotifyService.getPlaylist( value.uri )
							.then( function( playlist ){
								$scope.playlists.items.push( playlist );
							});
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
})


	
/**
 * Local files
 **/
.controller('LibraryFilesController', function ( $scope, $rootScope, $filter, $stateParams, $localStorage, SpotifyService, SettingsService, DialogService, MopidyService ){
	
	$scope.folders = [];
	$scope.tracklist = {tracks: []};	
	var folder, parentFolder;
	
	
	// rip out any slashes and pipes
	if( $stateParams.folder ){	
		folder = $stateParams.folder.replace('|','/');
	}
	
	// figure out our parent folder (provided we're not at the top-level already)
	if( !folder || folder != 'local:directory' ){
		
		// viewing top-level folders
		if(
			folder == 'local:directory?type=track' ||
			folder.indexOf('local:directory?type=date&') > -1 ||
			folder.indexOf('local:directory?max-age=') > -1 ){
				parentFolder = 'local:directory';
		}
		
		// release years
		if( folder.indexOf('local:directory?date=') > -1 ){
			parentFolder = 'local:directory?type=date&format=%25Y';
		}
		
		// artist
		if( folder.indexOf('local:directory?artist=') > -1 ){
			parentFolder = 'local:directory?type=artist';
		}
	}
	
	// on init, go get the items (or wait for mopidy to be online)
	if( $scope.mopidyOnline )
		getItems();
	else
		$scope.$on('mopidy:state:online', function(){ getItems() });
	
	
	// go get em
	function getItems(){
	
		MopidyService.getLibraryItems( folder )
			.then( function( response ){
			
					// load tracks
					var trackReferences = $filter('filter')(response, {type: 'track'});
					var trackUris = [];
					
					// loop all the track references, so we can get all the track objects
					for( var i = 0; i < trackReferences.length; i++ ){
						trackUris.push( trackReferences[i].uri );
					}
					
					// take our track references and look up the actual track objects
					if( trackUris.length > 0 ){
						MopidyService.getTracks( trackUris )
							.then( function( response ){
							
								var tracks = [];
								
								// loop all the tracks to sanitize the response
								for( var key in response ){
									var track = response[key][0];
									track.type = 'localtrack';
									tracks.push( track );
								}
								
								$scope.tracklist.tracks = tracks;
								
								console.table( tracks );
							});
					}
					
					// fetch the folders
					var folders = formatFolders( $filter('filter')(response, {type: 'directory'}) );
					
					// plug in our parent folder item
					if( parentFolder )
						folders.unshift({ name: '..', uri: parentFolder, type: 'directory', isParentFolder: true });
					
					// store our folders to the template-accessible variable
					$scope.folders = folders;
				});
	}
	
	
	/**
	 * Format our folders into the desired format
	 * @param items = array
	 * @return array
	 **/
	function formatFolders( items ){
		
		// sanitize uris
		for( var i = 0; i < items.length; i++ ){
			var item = items[i];
			
			// replace slashes (even urlencoded ones) to ":"
			item.uri = item.uri.replace('%2F', '|');
			item.uri = item.uri.replace('/', '|');
			
			items[i] = item;
		}
		
		return items;
	}
		
});




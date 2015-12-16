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
		/*
		 MORE COMPLEX THAN THE ALIAS TO PLAYLISTS (NESTED STATES). MAY NEED TO RECONSIDER APPROACH
		.state('library.artist', {
			url: "/artist/:uri",
			templateUrl: "app/browse/artist/template.html",
			controller: 'PlaylistController'
		})
		*/
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
	  
	$scope.tracklist = {tracks: []};
	
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
 * Local files
 **/
.controller('LibraryFilesController', function ( $scope, $rootScope, $filter, $stateParams, SpotifyService, SettingsService, DialogService, MopidyService ){
	
	$scope.folders = [];
	$scope.tracklist = {tracks: []};
	
	var folder, parentFolder;
	
	if( $stateParams.folder ){
	
		folder = $stateParams.folder;
		var parentFolders = folder.split('|');
		parentFolder = '';
		for( var i = 0; i < parentFolders.length-1; i++ ){
			showParentFolderLink = true;
			parentFolder += parentFolders[i];
			if( i < parentFolders.length-2 )
				parentFolder += '|';
		}
		
		if( parentFolder == '' )
			parentFolder = 'local:directory';
		
		folder = folder.replace('|','/');
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
					
					$scope.tracklist.tracks = $filter('filter')(response, {type: 'track'});
					var folders = formatFolders( $filter('filter')(response, {type: 'directory'}) );

					if( $stateParams.folder != 'local:directory' )
						folders.unshift({ name: '..', uri: parentFolder, type: 'directory', isParentFolder: true });
					
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
		
})

/**
 * Library playlist
 **/
.controller('LibraryPlaylistsController', function PlaylistsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
	
	$scope.playlists = [];
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
    
	SpotifyService.getPlaylists( userid )
		.then( function( response ){ // successful
				$scope.playlists = response;
				
				// if it was 401, refresh token
				if( typeof(response.error) !== 'undefined' && response.error.status == 401 )
					Spotify.refreshToken();
			});
    
	
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




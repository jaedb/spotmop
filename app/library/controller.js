angular.module('spotmop.library', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('library', {
			url: "/library",
			templateUrl: "app/library/template.html",
			controller: 'LibraryController'
		});
})
	
/**
 * Main controller
 **/
.controller('LibraryController', function PlaylistsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	  
	$scope.tracklist = {tracks: []};
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
	$rootScope.requestsLoading++;
    
	SpotifyService.getMyTracks( userid )
		.then(
			function( response ){ // successful
				$scope.tracklist = response.data;
				$scope.tracklist.tracks = reformatTracks( response.data.items );
				$rootScope.requestsLoading--;
			},
			function( response ){ // error
			
				// if it was 401, refresh token
				if( error.error.status == 401 )
					Spotify.refreshToken();
				
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-library', message: error.error.message});
			}
		);
		
		
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		var tracksToDelete = [];
		$rootScope.requestsLoading++;
		
		// construct each track into a json object to delete
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( SpotifyService.getFromUri( 'trackid', selectedTrack.uri ) );
		});
		
		// parse these uris to spotify and delete these tracks
		SpotifyService.deleteTracksFromLibrary( tracksToDelete )
			.success(function( response ){				
				$rootScope.requestsLoading--;
				
				// filter the playlist tracks to exclude all selected tracks (because we've just deleted them)
				// we could fetch a new version of the tracklist from Spotify, but that isn't really necessary
				$scope.tracklist.tracks = $filter('filter')($scope.tracklist.tracks, { selected: false });
			})
			.error(function( error ){
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'deleting-tracks', message: error.error.message});
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
		$rootScope.requestsLoading++;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.tracklist.tracks = $scope.tracklist.tracks.concat( reformatTracks( response.items ) );
                
                // save the next set's url (if it exists)
                $scope.tracklist.next = response.next;
                
                // update loader and re-open for further pagination objects
				$rootScope.requestsLoading--;
                loadingMoreTracks = false;
            })
            .error(function( error ){
                $rootScope.requestsLoading--;
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-tracks', message: error.error.message});
                loadingMoreTracks = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && typeof( $scope.tracklist.next ) !== 'undefined' && $scope.tracklist.next ){
            loadMoreTracks( $scope.tracklist.next );
        }
	});
	
});
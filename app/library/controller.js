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
.controller('LibraryController', function PlaylistsController( $scope, $rootScope, SpotifyService, SettingsService, DialogService ){
	  
	$scope.tracks;
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-library', message: 'Loading'});
    
	SpotifyService.getMyTracks( userid )
		.then(
			function( response ){ // successful
				$scope.tracks = response.data;
				$rootScope.$broadcast('spotmop:pageUpdated');
				$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-library'});
			},
			function( response ){ // error
			
				// if it was 401, refresh token
				if( error.error.status == 401 )
					Spotify.refreshToken();
			
				$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-library'});
				$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-library', message: error.error.message});
			}
		);
    
	
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
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-tracks', message: 'Loading tracks'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.tracks.items = $scope.tracks.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.tracks.next = response.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-tracks'});
                loadingMoreTracks = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-tracks'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-tracks', message: error.error.message});
                loadingMoreTracks = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && typeof( $scope.tracks.next ) !== 'undefined' && $scope.tracks.next ){
            loadMoreTracks( $scope.tracks.next );
        }
	});
	
});
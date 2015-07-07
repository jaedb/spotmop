angular.module('spotmop.discover.new', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('discover.new', {
			url: "/new",
			templateUrl: "app/discover/new/template.html",
			controller: 'NewController'
		});
})
	
/**
 * Main controller
 **/
.controller('NewController', function NewController( $scope, $element, $rootScope, SpotifyService ){
	
	// set the default items
	$scope.albums = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-new-releases', message: 'Loading'});
	
	SpotifyService.newReleases()
		.success(function( response ) {
			$scope.albums = response.albums;
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-new-releases'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-new-releases'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-new-releases', message: error.error.message});
        });
    
    
    /**
     * Load more of the category's playlists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreNewReleases = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreNewReleases( $nextUrl ){
        console.log('yep');
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreNewReleases = true;   
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-new-releases', message: 'Loading more releases'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.albums.items = $scope.albums.items.concat( response.albums.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.albums.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-new-releases'});
                $rootScope.$broadcast('spotmop:pageUpdated');
                loadingMoreNewReleases = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-new-releases'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-new-releases', message: error.error.message});
                loadingMoreNewReleases = false;
            });
    }
	
});
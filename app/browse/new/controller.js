angular.module('spotmop.browse.new', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.new', {
			url: "/new",
			templateUrl: "app/browse/new/template.html",
			controller: 'NewController'
		});
})
	
/**
 * Main controller
 **/
.controller('NewController', function NewController( $scope, $element, $rootScope, SpotifyService ){
	
	// set the default items
	$scope.albums = [];
	$rootScope.requestsLoading++;
	
	SpotifyService.newReleases()
		.success(function( response ) {
			$scope.albums = response.albums;
            $rootScope.requestsLoading--;
		})
        .error(function( error ){
            $rootScope.requestsLoading--;
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-new-releases', message: error.error.message});
        });
    
    
    /**
     * Load more of the category's playlists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreNewReleases = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreNewReleases( $nextUrl ){
		
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreNewReleases = true;   
        $rootScope.requestsLoading++;

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.albums.items = $scope.albums.items.concat( response.albums.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.albums.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.requestsLoading--;
                loadingMoreNewReleases = false;
            })
            .error(function( error ){
                $rootScope.requestsLoading--;
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-new-releases', message: error.error.message});
                loadingMoreNewReleases = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreNewReleases && typeof( $scope.albums.next ) !== 'undefined' && $scope.albums.next ){
            loadMoreNewReleases( $scope.albums.next );
        }
	});
	
});
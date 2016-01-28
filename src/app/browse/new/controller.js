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
		})
		.state('browse.newalbum', {
			url: "/new/:uri",
			templateUrl: "app/browse/album/template.html",
			controller: 'AlbumController'
		});
})
	
/**
 * Main controller
 **/
.controller('NewController', function NewController( $scope, $element, $rootScope, SpotifyService, MopidyService ){
	
	// set the default items
	$scope.albums = [];
		
	SpotifyService.newReleases()
		.then(function( response ) {
			$scope.albums = response.albums;
		});
	
	if( !SpotifyService.isAuthorized() ){
		console.log('Spotify offline');
		
		$scope.$on('mopidy:state:online', function(){
			console.log('Mopidy online');
			MopidyService.testMethod( "mopidy.library.browse", { uri: 'spotify:top:albums:everywhere' } )
				.then( function( response ){
					console.log( response );
				});
			});
	}
	
	
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

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.albums.items = $scope.albums.items.concat( response.albums.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.albums.next;
                
                // update loader and re-open for further pagination objects
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
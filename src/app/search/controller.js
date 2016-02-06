angular.module('spotmop.search', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('search', {
			url: "/search/:query/:type",
			templateUrl: "app/search/template.html",
			controller: 'SearchController',
			
			// this specifies default values if there are none defined in the URL
			params: {
				type: { squash: true, value: 'all' },
				query: { squash: true, value: null }
			}
		});
})
	
/**
 * Main controller
 **/
.controller('SearchController', function SearchController( $scope, $rootScope, $state, $stateParams, $timeout, $filter, SpotifyService ){
	
	$scope.tracklist = {tracks: [], type: 'track'};
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	$scope.type = $stateParams.type;
	$scope.query = '';
    if( $stateParams.query )
        $scope.query = $filter('stripAccents')( $stateParams.query );
        
	$scope.loading = false;
	var searchDelayer;

	// focus on our search field on load (if not touch device, otherwise we get annoying on-screen keyboard)
	if( !$scope.isTouchDevice() )
		$(document).find('.search-form input.query').focus();
	
	// if we've just loaded this page, and we have params, let's perform a search
	if( $scope.query )
		performSearch( $scope.type, $scope.query );
	
	
	/**
	 * Fetch the search results
	 * This defines the type of search requests we'll perform, and thus the page layout
	 * @param type = string (type of search results, all/artist/playlist/album/etc)
	 * @param query = string
	 **/
	function performSearch( type, query ){
	
		if( typeof(type) === 'undefined' )
			var type = $scope.type;
		
		switch( type ){
			
			case 'track' :
				SpotifyService.getSearchResults( 'track', query, 50 )
					.then( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.tracks = response.tracks.items;
						$scope.tracklist.type = 'track';
						$scope.next = response.tracks.next;
					});
				break;
			
			case 'album' :
				SpotifyService.getSearchResults( 'album', query, 50 )
					.then( function(response){		
						$scope.albums = response.albums;
						$scope.next = response.albums.next;
					});
				break;
					
			case 'artist' :
				SpotifyService.getSearchResults( 'artist', query, 50 )
					.then( function(response){		
						$scope.artists = response.artists;
						$scope.next = response.artists.next;
					});
				break;
					
			case 'playlist' :
				SpotifyService.getSearchResults( 'playlist', query, 50 )
					.then( function(response){		
						$scope.playlists = response.playlists;
						$scope.next = response.playlists.next;
					});
				break;
			
			default :
				SpotifyService.getSearchResults( 'track', query, 50 )
					.then( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.type = 'track';
						$scope.tracklist.tracks = response.tracks.items;
					});	
					
				SpotifyService.getSearchResults( 'album', query, 50 )
					.then( function(response){		
						$scope.albums = response.albums;
					});
					
				SpotifyService.getSearchResults( 'artist', query, 50 )
					.then( function(response){		
						$scope.artists = response.artists;
					});
					
				SpotifyService.getSearchResults( 'playlist', query, 50 )
					.then( function(response){		
						$scope.playlists = response.playlists;
							
					});
				break;
		}
	}
	
	
    /**
     * Load more results
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreResults = false;
	
    function loadMoreResults( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreResults = true; 

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new playlists to our existing array
				switch( $scope.type ){
					case 'artist':
						$scope.artists.items = $scope.artists.items.concat( response.artists.items );
						$scope.next = response.artists.next;
						break;
					case 'album':
						$scope.albums.items = $scope.albums.items.concat( response.albums.items );
						$scope.next = response.albums.next;
						break;
					case 'track':
						$scope.tracklist.tracks = $scope.tracklist.tracks.concat( response.tracks.items );
						$scope.next = response.tracks.next;
						break;
					case 'playlist':
						$scope.playlists.items = $scope.playlists.items.concat( response.playlists.items );
						$scope.next = response.playlists.next;
						break;
				}
                
                // update loader and re-open for further pagination objects
                loadingMoreResults = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreResults && typeof( $scope.next ) !== 'undefined' && $scope.next ){
            loadMoreResults( $scope.next );
        }
	});
});
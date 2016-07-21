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
.controller('SearchController', function SearchController( $scope, $rootScope, $state, $stateParams, $timeout, $filter, SpotifyService, MopidyService ){
	
	$scope.tracklist = {tracks: [], type: 'track'};
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	$scope.other = {tracks: [], type: 'track'};
	$scope.type = $stateParams.type;
	$scope.typeFilterOptions = [
			{
				type: 'all',
				icon: 'list',
				label: 'All'
			},
			{
				type: 'artist',
				icon: 'mic',
				label: 'Artists'
			},
			{
				type: 'album',
				icon: 'cd',
				label: 'Albums'
			},
			{
				type: 'playlist',
				icon: 'playlist',
				label: 'Playlists'
			},
			{
				type: 'track',
				icon: 'music',
				label: 'Tracks'
			},
			{
				type: 'other',
				icon: 'folder',
				label: 'Other'
			}
		];
	$scope.query = '';
    if( $stateParams.query )
        $scope.query = $filter('stripAccents')( $stateParams.query );
		
	var nextOffset = 50;
        
	$scope.loading = false;
	var searchDelayer;

	// focus on our search field on load (if not touch device, otherwise we get annoying on-screen keyboard)
	if( !$scope.isTouchMode() )
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
						$scope.tracklist.tracks = $scope.tracklist.tracks.concat( response.tracks.items );
						$scope.tracklist.type = 'track';
						$scope.tracklist.next = response.tracks.next;
						if( response.tracks.next )
							nextOffset = response.tracks.offset + response.tracks.limit;
						else
							nextOffset = false;
					});
				break;
			
			case 'album' :
				SpotifyService.getSearchResults( 'album', query, 50 )
					.then( function(response){
						$scope.albums = response.albums;
						if( response.albums.next )
							nextOffset = response.albums.offset + response.albums.limit;
						else
							nextOffset = false;
					});
				break;
					
			case 'artist' :
				SpotifyService.getSearchResults( 'artist', query, 50 )
					.then( function(response){		
						$scope.artists = response.artists;
						$scope.next = response.artists.next;
						$scope.offset = response.artists.offset;
					});
				break;
					
			case 'playlist' :
				SpotifyService.getSearchResults( 'playlist', query, 50 )
					.then( function(response){		
						$scope.playlists = response.playlists;
						$scope.next = response.playlists.next;
						$scope.offset = response.playlists.offset;
					});
				break;
					
			case 'other' :
				if( $rootScope.mopidyOnline ){
					mopidySearch( $scope.query );
				}else{
					$rootScope.$on('mopidy:state:online', function(){
						mopidySearch( $scope.query );
					});
				}
				break;
			
			default :
				SpotifyService.getSearchResults( 'track,album,artist,playlist', query, 50 )
					.then( function(response){
						$scope.albums = response.albums;
						$scope.artists = response.artists;
						$scope.playlists = response.playlists;
						$scope.tracklist = response.tracks;
						$scope.tracklist.type = 'track';
						$scope.tracklist.tracks = response.tracks.items;
					});	
				break;
		}
	}
	
	
	
	/**
	 * Perform mopidy search
	 **/
	function mopidySearch( query ){		
		MopidyService.search(query, false, ['soundcloud:','local:'])
			.then( function(response){
				// loop all our result sources (-1 in index because last item is the uri record)
				for( var i = 0; i < response.length; i++ ){
					if( typeof(response[i].tracks) !== 'undefined' ){
						for( var j = 0; j < response[i].tracks.length - 1; j++ ){
							$scope.other.tracks = $scope.other.tracks.concat( response[i].tracks[j] );
						}
					}
				}
			});
	}
	
	
	
	
    /**
     * Load more results
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreResults = false;
	
    function loadMoreResults( offset ){
        
        if( typeof( offset ) === 'undefined' || $scope.type == 'other' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreResults = true;
		
		// if our search page is "all", we need to adjust our search params to Spotify as "all" is not valid
		var type = $scope.type;
		if( type == 'all' )	type = 'track';
		
        // go get our 'next' URL
        SpotifyService.getSearchResults( type, $scope.query, 50, offset )
            .then(function( response ){
            
                // append these new playlists to our existing array
				switch( $scope.type ){
					case 'artist':
						$scope.artists.items = $scope.artists.items.concat( response.artists.items );
						$scope.next = response.artists.next;
						$scope.offset = response.artists.offset;
						break;
					case 'album':
						$scope.albums.items = $scope.albums.items.concat( response.albums.items );
						if( response.albums.next )
							nextOffset = response.albums.offset + response.albums.limit;
						else
							nextOffset = false;
						break;
					case 'track':
						$scope.tracklist.tracks = $scope.tracklist.tracks.concat( response.tracks.items );
						$scope.next = response.tracks.next;
						$scope.offset = response.tracks.offset;
						break;
					case 'playlist':
						$scope.playlists.items = $scope.playlists.items.concat( response.playlists.items );
						$scope.next = response.playlists.next;
						$scope.offset = response.playlists.offset;
						break;
					case 'all':
						$scope.tracklist.tracks = $scope.tracklist.tracks.concat( response.tracks.items );
						$scope.next = response.tracks.next;
						$scope.offset = response.tracks.offset;
						break;
				}
                
                // update loader and re-open for further pagination objects
                loadingMoreResults = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreResults && nextOffset ){
            loadMoreResults( nextOffset );
        }
	});
});
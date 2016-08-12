angular.module('spotmop.search', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('search', {
			url: "/search/:query",
			templateUrl: "app/search/template.html",
			controller: 'SearchController'
		});
})
	
/**
 * Main controller
 **/
.controller('SearchController', function SearchController( $scope, $rootScope, $state, $stateParams, $timeout, $filter, SpotifyService, MopidyService, SettingsService ){
	
	$scope.settings = SettingsService.getSettings();
	$scope.results = {
		tracks: [],
		albums: [],
		artists: [],
		playlists: []
	};
	
	$scope.sourceOptions = [
			{ value: 'all', label: 'All' },
			{ value: 'spotify', label: 'Spotify' },
			{ value: 'local', label: 'Local' },
			{ value: 'soundcloud', label: 'Soundcloud' },
			{ value: 'yt', label: 'YouTube' }
		];
	
	$scope.typeOptions = [
			{ value: 'any', label: 'All' },
			{ value: 'album', label: 'Albums' },
			{ value: 'artist', label: 'Artists' },
			{ value: 'track_name', label: 'Tracks' }
		];
	
	$scope.query = '';
    if( $stateParams.query ) $scope.query = $filter('stripAccents')( $stateParams.query );
		
	var nextOffset = 50;
        
	$scope.loading = false;
	var searchDelayer;

	// focus on our search field on load (if not touch device, otherwise we get annoying on-screen keyboard)
	if( !$scope.isTouchMode() ) $(document).find('.search-form input.query').focus();
	
	// if we've just loaded this page, and we have params, let's perform a search
	if( $scope.query ) performSearch( $scope.query );
	
	// when our source changes, perform a new search
	// TODO: THIS CREATES DUPLICATES WHEN WE NAVIGATE ELSEWHERE AND THEN RETURN
	$rootScope.$on('spotmop:settingchanged:search.source', function(event,value){
		performSearch( $scope.query );
	});
	$rootScope.$on('spotmop:settingchanged:search.type', function(event,value){
		performSearch( $scope.query );
	});
	
	
	/**
	 * Fetch the search results
	 * This defines the type of search requests we'll perform, and thus the page layout
	 * @param type = string (type of search results, all/artist/playlist/album/etc)
	 * @param query = string
	 **/
	function performSearch( query ){
		
		if( $rootScope.mopidyOnline ){
			mopidySearch( $scope.query );
		}else{
			$rootScope.$on('mopidy:state:online', function(){
				mopidySearch( $scope.query );
			});
		}
	}
	
	
	
	/**
	 * Perform mopidy search
	 **/
	function mopidySearch( query ){
		
		// prepare our source option into a mopidy-friendly object
		var sources = $scope.settings.search.source;
		if( sources == 'all' ){
			sources = null;
		}else{
			sources = [ sources+':' ];
		}
		
		// explode our fields to an array
		var fields = $scope.settings.search.type.split(',');
		
		// flush out any previous search results
		$scope.results.tracks = [];
		$scope.results.albums = [];
		$scope.results.artists = [];
		
		// perform the search
		MopidyService.search(fields, query, sources)
			.then( function(sources){
				console.log( sources );
				for( var i = 0; i < sources.length; i++ ){
					var source = sources[i];
					
					if( typeof(source.tracks) !== 'undefined' ){
						$scope.results.tracks = $scope.results.tracks.concat( source.tracks );
					}
					
					if( typeof(source.artists) !== 'undefined' ){
						digestArtists( source.artists );
					}
					
					if( typeof(source.albums) !== 'undefined' ){
						digestAlbums( source.albums );
					}
				}
			});
			
		function digestArtists( items ){
			console.table(items);
			for( var i = 0; i < items.length; i++ ){
				SpotifyService.getArtist( items[i].uri )
					.then( function(artist){
						$scope.results.artists = $scope.results.artists.concat( artist );
					});
			}
		}
			
		function digestAlbums( items ){
			for( var i = 0; i < items.length; i++ ){
				SpotifyService.getAlbum( items[i].uri )
					.then( function(album){
						$scope.results.albums = $scope.results.albums.concat( album );
					});
			}
		}
			/*
		MopidyService.testMethod('local.search', { query: { ['any': query] } })
			.then( function(response){
				console.log( response );
			});*/
	} 
	
	
	
	
    /**
     * Load more results
     * Triggered by scrolling to the bottom
     **/
    /*
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
    */
});
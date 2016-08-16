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
	$scope.$on('spotmop:settingchanged:search.source', function(event,value){
		performSearch( $scope.query );
	});
	$scope.$on('spotmop:settingchanged:search.type', function(event,value){
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
		var sources = SettingsService.getSetting('search.source');
		if( sources == null || sources == 'all' ){
			sources = null;
		}else{
			sources = [ sources+':' ];
		}
		
		// explode our fields to an array
		var type = SettingsService.getSetting('search.type');
		if( type == null ) type = 'any';
		var fields = type.split(',');
		
		// flush out any previous search results
		$scope.results.tracks = [];
		$scope.results.albums = [];
		$scope.results.artists = [];
		
		// perform the search
		MopidyService.search(fields, query, sources)
			.then( function(sources){
				
				for( var i = 0; i < sources.length; i++ ){
					var source = sources[i];
					
                    switch( SettingsService.getSetting('search.type') ){
						
                        case 'artist':
                            if( typeof(source.artists) !== 'undefined' ){
								digestSpotifyArtists( source.artists );
                            }else if( typeof(source.tracks) !== 'undefined' ){
								digestTracksAsArtists( source.tracks );
							}
                            break;
                            
                        case 'album':
                            if( typeof(source.albums) !== 'undefined' ){
								digestSpotifyAlbums( source.albums );
                            }else if( typeof(source.tracks) !== 'undefined' ){
								digestTracksAsAlbums( source.tracks );
							}
                            break;
                            
                        default:
                            if( typeof(source.artists) !== 'undefined' ){
								digestSpotifyArtists( source.artists, 6 );
							}
                            if( typeof(source.albums) !== 'undefined' ){
								digestSpotifyAlbums( source.albums, 6 );
							}
                            if( typeof(source.tracks) !== 'undefined' ){
                                $scope.results.tracks = $scope.results.tracks.concat( source.tracks );
								
								// only digest tracks as artists if we didn't get any explicit artist results
								if( typeof(source.artists) === 'undefined' ){
									digestTracksAsArtists( source.tracks, 6 );
								}
								// only digest tracks as albums if we didn't get any explicit album results
								if( typeof(source.albums) === 'undefined' ){
									digestTracksAsAlbums( source.tracks, 6 );
								}
                            }
                            break;
                    }
				}
			});
        
        function digestTracksAsAlbums( items, limit ){
			if( typeof(limit) === 'undefined') var limit = items.length;
            var albums = [];
            var albumUrisProcessed = [];
            for( var i = 0; i < limit; i++ ){
                if( typeof(items[i]) !== 'undefined' && typeof(items[i].album) !== 'undefined' ){
                    var album = items[i].album;
                    if( typeof(album.uri) !== 'undefined' && albumUrisProcessed.indexOf( album.uri ) <= -1 ){
                        albums.push( album );
                        albumUrisProcessed.push( album.uri );
                    }
                }
            }
            $scope.results.albums = $scope.results.albums.concat( albums );
        }
        
        function digestTracksAsArtists( items, limit ){
			if( typeof(limit) === 'undefined') var limit = items.length;
            var artists = [];
            var artistUrisProcessed = [];
            for( var i = 0; i < limit; i++ ){
                if( typeof(items[i]) !== 'undefined' && typeof(items[i].artists) !== 'undefined' ){
                    for( var j = 0; j < items[i].artists.length; j++ ){
                        var artist = items[i].artists[j];
                        if( typeof(artist.uri) !== 'undefined' && artistUrisProcessed.indexOf( artist.uri ) <= -1 ){
                            artists.push( artist );
                            artistUrisProcessed.push( artist.uri );
                        }
                    }
                }
            }
			
			$scope.results.artists = $scope.results.artists.concat( artists );
        }
        
		function digestSpotifyArtists( items, limit ){
			if( typeof(limit) === 'undefined') var limit = items.length;
			var ids = [];
			for( var i = 0; i < limit; i++ ){
				if( typeof(items[i]) !== 'undefined' &&  typeof(items[i].uri) !== 'undefined' ){
					ids.push( SpotifyService.getFromUri('artistid', items[i].uri) );
				}
			}
			SpotifyService.getArtists( ids )
				.then( function(artists){
					console.log( artists );
					$scope.results.artists = $scope.results.artists.concat( artists );
				});
		}
			
		function digestSpotifyAlbums( items, limit ){
			if( typeof(limit) === 'undefined') var limit = items.length;
			var ids = [];
			for( var i = 0; i < limit; i++ ){
				if( typeof(items[i]) !== 'undefined' &&  typeof(items[i].uri) !== 'undefined' ){
					ids.push( SpotifyService.getFromUri('albumid', items[i].uri) );
				}
			}
			SpotifyService.getAlbums( ids )
				.then( function(albums){
					$scope.results.albums = $scope.results.albums.concat( albums );
				});
		}
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
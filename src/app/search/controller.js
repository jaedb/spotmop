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
	if( $scope.query ) initiateSearch();
	
	// when our source changes, perform a new search
	$scope.$on('spotmop:settingchanged:search.source', function(event,value){
		initiateSearch();
	});
	$scope.$on('spotmop:settingchanged:search.type', function(event,value){
		initiateSearch();
	});
	
	
	/**
	 * Initiate the seach process
	 * We can't jump straight in, as we need to make sure Mopidy is online first
	 **/
	function initiateSearch(){		
		if( $rootScope.mopidyOnline ){
			performSearch( $scope.query );
		}
	}
	
	// when mopidy is online, perform the search
	$rootScope.$on('mopidy:state:online', function(){
		performSearch( $scope.query );
	});
	
	
	
	/**
	 * Perform the actual searching
	 **/
	function performSearch( query ){
		
		// prepare our source option into a mopidy-friendly object
		var source = SettingsService.getSetting('search.source');
		var sources = null;
		if( source && source != 'all' ){
			sources = [ source+':' ];
		}
		
		// explode our fields to an array
		var type = SettingsService.getSetting('search.type');
		if( type == null ) type = 'any';
		var fields = type.split(',');
		
		// flush out any previous search results
		$scope.results.tracks = [];
		$scope.results.albums = [];
		$scope.results.artists = [];
		$scope.results.playlists = [];
		
		// perform the mopidy search
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
			
		// perform the spotify search (just for playlists)
		if( source == 'all' || source == 'spotify' ){
			SpotifyService.getSearchResults('playlist', $scope.query, 6, 0)
				.then( function(response){
					$scope.results.playlists = response.playlists.items;
				});
		}
	} 
	
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
});
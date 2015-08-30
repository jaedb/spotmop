angular.module('spotmop.search', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('search', {
			url: "/search/:type/:query",
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
.controller('SearchController', function SearchController( $scope, $rootScope, $state, $stateParams, $timeout, SpotifyService ){
	
	$scope.tracklist = {tracks: []};
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	$scope.type = $stateParams.type;
	$scope.query = $stateParams.query;
	$scope.loading = false;
	var searchDelayer;
	
	$scope.dropdownActive = false;
	$scope.toggleDropdown = function(){
		if( $scope.dropdownActive )
			$scope.dropdownActive = false;
		else
			$scope.dropdownActive = true;
	}
	
	// focus on our search field on load
	$(document).find('.search-form input.query').focus();
	
	// if we've just loaded this page, and we have params, let's perform a search
	if( $scope.query )
		performSearch( $scope.type, $scope.query );
	
	/**
	 * Watch our query string for changes
	 * When changed, clear all results, wait for 0.5 seconds for next key, then fire off the search
	 **/
    var tempQuery = '', queryTimeout;
    $scope.$watch('query', function(newValue, oldValue){
		
		if( newValue != oldValue && newValue && newValue != '' ){
			$scope.loading = true;
			$scope.tracklist = {tracks: []};
			$scope.albums = [];
			$scope.artists = [];
			$scope.playlists = [];
			
			if (queryTimeout)
				$timeout.cancel(queryTimeout);

			tempQuery = newValue;
			queryTimeout = $timeout(function() {
				$scope.query = tempQuery;
				performSearch( $scope.type, $scope.query );	
			}, 1000);
		}
    })
	
	
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
				$scope.loading = true;
				SpotifyService.getSearchResults( 'track', query, 50 )
					.success( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.tracks = response.tracks.items;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
			
			case 'album' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'album', query, 20 )
					.success( function(response){		
						$scope.albums = response.albums;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
					
			case 'artist' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'artist', query, 20 )
					.success( function(response){		
						$scope.artists = response.artists;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
					
			case 'playlist' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'playlist', query, 20 )
					.success( function(response){		
						$scope.playlists = response.playlists;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
			
			default :
				$scope.loading = 4;
				SpotifyService.getSearchResults( 'track', query, 20 )
					.success( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.tracks = response.tracks.items;
						
						// handle loading (remembering that these queries may finish in a different order)
						$scope.loading = $scope.loading - 1;
						if( $scope.loading <= 0 )
							$rootScope.$broadcast('spotmop:pageUpdated');
					});	
					
				SpotifyService.getSearchResults( 'album', query, 6 )
					.success( function(response){		
						$scope.albums = response.albums;
						
						// handle loading (remembering that these queries may finish in a different order)
						$scope.loading = $scope.loading - 1;
						if( $scope.loading <= 0 )
							$rootScope.$broadcast('spotmop:pageUpdated');
					});
					
				SpotifyService.getSearchResults( 'artist', query, 6 )
					.success( function(response){		
						$scope.artists = response.artists;
						
						// handle loading (remembering that these queries may finish in a different order)
						$scope.loading = $scope.loading - 1;
						if( $scope.loading <= 0 )
							$rootScope.$broadcast('spotmop:pageUpdated');
					});
					
				SpotifyService.getSearchResults( 'playlist', query, 6 )
					.success( function(response){		
						$scope.playlists = response.playlists;
						
						// handle loading (remembering that these queries may finish in a different order)
						$scope.loading = $scope.loading - 1;
						if( $scope.loading <= 0 )
							$rootScope.$broadcast('spotmop:pageUpdated');
							
					});
				break;
		}
	}
});
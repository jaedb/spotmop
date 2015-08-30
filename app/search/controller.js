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
	
	$scope.query = $stateParams.query;
	$scope.tracklist = {tracks: []};
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	$scope.type = $stateParams.type;	
	$scope.loading = false;
	
	$scope.dropdownActive = false;
	$scope.toggleDropdown = function(){
		if( $scope.dropdownActive )
			$scope.dropdownActive = false;
		else
			$scope.dropdownActive = true;
	}
	
	/**
	 * Watch our query string for changes
	 * When changed, clear all results, wait for 0.5 seconds for next key, then fire off the search
	 **/
	$scope.$watch('[query]', function (){
		$scope.loading = true;
		$scope.tracklist = {tracks: []};
		$scope.albums = [];
		$scope.artists = [];
		$scope.playlists = [];
		$timeout(
			function(){
				//$state.go('search',{ type: $scope.type, query: $scope.query});			
			}, 500
		);
	}, true);
	
	
	/**
	 * On init, figure out what type of results we want
	 * This defines the type of search requests we'll perform, and thus the page layout
	 **/
	if( $scope.query ){
		switch( $stateParams.type ){
			
			case 'track' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'track', $stateParams.query, 50 )
					.success( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.tracks = response.tracks.items;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
			
			case 'album' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'album', $stateParams.query, 20 )
					.success( function(response){		
						$scope.albums = response.albums;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
					
			case 'artist' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'artist', $stateParams.query, 20 )
					.success( function(response){		
						$scope.artists = response.artists;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
					
			case 'playlist' :
				$scope.loading = true;
				SpotifyService.getSearchResults( 'playlist', $stateParams.query, 20 )
					.success( function(response){		
						$scope.playlists = response.playlists;
						$rootScope.$broadcast('spotmop:pageUpdated');
						$scope.loading = false;
					});
				break;
			
			default :
				$scope.loading = 4;
				SpotifyService.getSearchResults( 'track', $stateParams.query, 20 )
					.success( function(response){
						$scope.tracklist = response.tracks;
						$scope.tracklist.tracks = response.tracks.items;
						$scope.loading -= 1;
					});	
					
				SpotifyService.getSearchResults( 'album', $stateParams.query, 6 )
					.success( function(response){		
						$scope.albums = response.albums;
						$scope.loading -= 1;
					});
					
				SpotifyService.getSearchResults( 'artist', $stateParams.query, 6 )
					.success( function(response){		
						$scope.artists = response.artists;
						$scope.loading -= 1;
					});
					
				SpotifyService.getSearchResults( 'playlist', $stateParams.query, 6 )
					.success( function(response){		
						$scope.playlists = response.playlists;
						$scope.loading -= 1;
					});
				break;
		}
	}
});
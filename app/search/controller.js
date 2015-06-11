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
.controller('SearchController', function SearchController( $scope, $rootScope, $stateParams, $timeout, SpotifyService ){
	
	$scope.query = $stateParams.query;
	$scope.tracks = [];
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	
	SpotifyService.getSearchResults( 'track', $stateParams.query, 20 )
		.success( function(response){
		
			$scope.tracks = response.tracks;
			SpotifyService.getSearchResults( 'album', $stateParams.query, 6 )
				.success( function(response){
				
					$scope.albums = response.albums;
					SpotifyService.getSearchResults( 'artist', $stateParams.query, 6 )
						.success( function(response){
						
							$scope.artists = response.artists;
								SpotifyService.getSearchResults( 'playlist', $stateParams.query, 6 )
									.success( function(response){
									
										$scope.playlists = response.playlists;
										$rootScope.$broadcast('spotmop:pageUpdated');
									});
						});
				});
		});	
});
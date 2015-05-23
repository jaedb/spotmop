
angular.module('spotmop.search', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/search/:query", {
        templateUrl: "app/search/template.html",
        controller: "SearchController"
    });
})
	
.controller('SearchController', function SearchController( $scope, $rootScope, $routeParams, $timeout, SpotifyService ){
	
	$scope.query = $routeParams.query;
	$scope.tracks = [];
	$scope.albums = [];
	$scope.artists = [];
	$scope.playlists = [];
	
	SpotifyService.getSearchResults( 'track', $routeParams.query, 20 )
		.success( function(response){
		
			$scope.tracks = response.tracks;
			SpotifyService.getSearchResults( 'album', $routeParams.query, 6 )
				.success( function(response){
				
					$scope.albums = response.albums;
					SpotifyService.getSearchResults( 'artist', $routeParams.query, 6 )
						.success( function(response){
						
							$scope.artists = response.artists;
								SpotifyService.getSearchResults( 'playlist', $routeParams.query, 6 )
									.success( function(response){
									
										$scope.playlists = response.playlists;
										$rootScope.$broadcast('spotmop:pageUpdated');
									});
						});
				});
		});	
});
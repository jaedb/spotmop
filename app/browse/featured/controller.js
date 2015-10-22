angular.module('spotmop.browse.featured', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.featured', {
			url: "/featured",
			templateUrl: "app/browse/featured/template.html",
			controller: 'FeaturedController'
		})
		.state('browse.featuredplaylist', {
			url: "/featured/:uri",
			templateUrl: "app/browse/playlist/template.html",
			controller: 'PlaylistController'
		});
})
	
/**
 * Main controller
 **/
.controller('FeaturedController', function FeaturedController( $scope, $rootScope, SpotifyService ){	
	
	// set the default items
	$scope.playlists = [];
	$rootScope.requestsLoading++;
	
	SpotifyService.featuredPlaylists()
		.success(function( response ) {
			$scope.playlists = response.playlists.items;
            $rootScope.requestsLoading--;
		})
        .error(function( error ){
            $rootScope.requestsLoading--;
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-featured-playlists', message: error.error.message});
        });
});
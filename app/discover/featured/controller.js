'use strict';

angular.module('spotmop.discover.featured', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config( function($routeProvider) {
    $routeProvider.when("/discover/featured", {
        templateUrl: "/app/discover/featured/template.html",
        controller: "FeaturedController"
    });
})
	
.controller('FeaturedController', function FeaturedController( $scope, SpotifyService ){	
	
	// set the default items
	$scope.playlists = [];
	
	SpotifyService.featuredPlaylists()
		.success(function( response ) {
			$scope.playlists = response.playlists.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
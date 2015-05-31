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
	
.controller('FeaturedController', function FeaturedController( $scope, $rootScope, SpotifyService ){	
	
	// set the default items
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-featured-playlists', message: 'Loading'});
	
	SpotifyService.featuredPlaylists()
		.success(function( response ) {
			$scope.playlists = response.playlists.items;
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-featured-playlists'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-featured-playlists'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-featured-playlists', message: error.error.message});
        });
});
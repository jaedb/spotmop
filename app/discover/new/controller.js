'use strict';

angular.module('spotmop.discover.new', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/discover/new", {
        templateUrl: "app/discover/new/template.html",
        controller: "NewController"
    });
})
	
.controller('NewController', function NewController( $scope, SpotifyService ){
	
	// set the default items
	$scope.albums = [];
	
	SpotifyService.newReleases()
		.success(function( response ) {
			$scope.albums = response.albums.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
});
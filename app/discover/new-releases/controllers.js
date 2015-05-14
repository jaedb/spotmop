'use strict';

angular.module('spotmop.discover.newreleases', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
	/*
    $routeProvider.when("/account/settings", {
        templateUrl: "account/settings/settings.tmpl.html",
        controller: "SettingsController"
    });*/
})
	
.controller('DiscoverNewReleasesController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.albums = [];
	
	Spotify.NewReleases()
		.success(function( response ) {
			$scope.albums = response.albums.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
}]);
'use strict';

angular.module('spotmop.discover.featuredplaylists', [
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
	
.controller('DiscoverFeaturedPlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.playlists = [];
	
	Spotify.FeaturedPlaylists()
		.success(function( response ) {
			$scope.playlists = response.playlists.items;
		})
		.error(function (error) {
			$scope.status = 'Unable to load featured playlists: ' + error.message;
		});
	
}]);
'use strict';

angular.module('spotmop.playlists', [
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
	
.controller('PlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.playlists = [];
	
	Spotify.MyPlaylists()
		.success(function( response ) {
			$scope.playlists = response.items;
		})
		.error(function( error ){
			
			// if it was 401, refresh token
			if( error.error.status == 401 )
				Spotify.refreshToken();
		
			$scope.status = 'Unable to load your playlists: ' + error.message;
		});
	
}]);
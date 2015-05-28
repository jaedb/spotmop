'use strict';

angular.module('spotmop.playlists', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/playlists", {
        templateUrl: "app/playlists/template.html",
        controller: "PlaylistsController"
    });
})
	
.controller('PlaylistsController', function PlaylistsController( $scope, $rootScope, SpotifyService, SettingsService ){
	
	// set the default items
	$scope.playlists = [];
    
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
    
	SpotifyService.getPlaylists( userid )
		.then(
			function( response ){ // successful
				$scope.playlists = response.data.items;
				$rootScope.$broadcast('spotmop:pageUpdated');
			},
			function( response ){ // error
				console.log( response );
			
				// if it was 401, refresh token
				if( error.error.status == 401 )
					Spotify.refreshToken();
			
				$scope.status = 'Unable to load your playlists: ' + error.message;
			}
		);
	
});
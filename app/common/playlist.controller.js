'use strict';

angular.module('spotmop.playlist', [
    'ngRoute'
])

.controller('PlaylistController', function PlaylistController( $scope, SpotifyService, $routeParams ){
	
	$scope.playlist = {};
	
	SpotifyService.getPlaylist( $routeParams.playlisturi )
		.success(function( response ) {
			$scope.playlist = response;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
});
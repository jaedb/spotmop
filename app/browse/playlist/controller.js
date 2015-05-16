'use strict';

angular.module('spotmop.browse.playlist', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/browse/playlist/:uri", {
        templateUrl: "app/browse/playlist/template.html",
        controller: "PlaylistController"
    });
})

.controller('PlaylistController', function PlaylistController( $scope, SpotifyService, $routeParams ){
		
	$scope.playlist = {};
	$scope.tracks = {};
	
	SpotifyService.getPlaylist( $routeParams.uri )
		.success(function( response ) {
			$scope.playlist = response;
			$scope.tracks = response.tracks;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
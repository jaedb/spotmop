'use strict';

angular.module('spotmop.music.playlist', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/music/playlist/:uri", {
        templateUrl: "app/music/playlist/template.html",
        controller: "PlaylistController"
    });
})

.controller('PlaylistController', function PlaylistController( $scope, SpotifyService, $routeParams ){
		
	$scope.playlist = {};
	$scope.tracklist = {};
	
	SpotifyService.getPlaylist( $routeParams.uri )
		.success(function( response ) {
			$scope.playlist = response;
			$scope.tracklist = response.tracks.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
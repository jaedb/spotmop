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
	$scope.totalTime = 0;
	
	SpotifyService.getPlaylist( $routeParams.uri )
		.success(function( response ) {
			$scope.playlist = response;
			$scope.tracks = response.tracks;
			
			// figure out the total time for all tracks
			var totalTime = 0;
			$.each( $scope.tracks.items, function( key, track ){
				totalTime += track.track.duration_ms;
			});	
			$scope.totalTime = Math.round(totalTime / 100000);
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
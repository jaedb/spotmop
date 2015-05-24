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
	
	// setup base variables
	$scope.playlist = {};
	$scope.tracks = {};
	$scope.totalTime = 0;
	
	// on load, fetch the playlist
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
	
	/**
	 * Delete tracks from this playlist
	 * @param tracksDOM = jQuery array of dom tracks
	 * @param tracks = json array of track info (ie {uri: "XX"});
	 **/
	$scope.deleteTracks = function( tracksDOM, tracks ){
		
		var playlistid = SpotifyService.getFromUri('playlistid',$routeParams.uri);
		
		// parse these uris to spotify and delete these tracks
		SpotifyService.deleteTracksFromPlaylist( playlistid, tracks )
			.success(function( response ) {
				tracksDOM.slideUp('fast', function(evt){ tracksDOM.remove() });
			})
			.error(function( error ){
				console.log( error );
			});
	};
});
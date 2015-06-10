'use strict';

angular.module('spotmop.browse_album', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse_album', {
			url: "/browse_album/:uri",
			templateUrl: "app/browse/album/template.html",
			controller: 'AlbumController'
		});
})
	
/**
 * Main controller
 **/
.controller('AlbumController', function AlbumController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.album = {};
	$scope.tracks = {};
	$scope.totalTime = 0;
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-album', message: 'Loading'});
	
	// get the artist
	SpotifyService.getAlbum( $stateParams.uri )
		.success(function( response ) {
			$scope.album = response;
			$scope.tracks = response.tracks;
			
			// figure out the total time for all tracks
			var totalTime = 0;
			$.each( $scope.tracks.items, function( key, track ){
				totalTime += track.duration_ms;
                track.album = $scope.album;
			});	
			$scope.totalTime = Math.round(totalTime / 10000);
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-album'});
		})
		.error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-album'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-album', message: error.error.message});
		});
});
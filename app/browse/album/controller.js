'use strict';

angular.module('spotmop.browse.album', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/browse/album/:uri", {
        templateUrl: "app/browse/album/template.html",
        controller: "AlbumController"
    });
})

.controller('AlbumController', function AlbumController( $scope, SpotifyService, $routeParams ){
	
	$scope.album = {};
	$scope.tracks = {};
	
	// get the artist
	SpotifyService.getAlbum( $routeParams.uri )
		.success(function( response ) {
			$scope.album = response;
			$scope.tracks = response.tracks;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
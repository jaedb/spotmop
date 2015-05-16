'use strict';

angular.module('spotmop.browse.artist', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/browse/artist/:uri", {
        templateUrl: "app/browse/artist/template.html",
        controller: "ArtistController"
    });
})

.controller('ArtistController', function ArtistController( $scope, SpotifyService, $routeParams ){
	
	$scope.artist = {};
	$scope.tracklist = {};
	$scope.albums = {};
	$scope.relatedArtists = {};
	
	// get the artist
	SpotifyService.getArtist( $routeParams.uri )
		.success(function( response ) {
			$scope.artist = response;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
	// get the artist's albums
	SpotifyService.getAlbums( $routeParams.uri )
		.success(function( response ) {
			$scope.albums = response;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
});
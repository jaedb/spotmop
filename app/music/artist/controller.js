'use strict';

angular.module('spotmop.music.artist', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/music/artist/:uri", {
        templateUrl: "app/music/artist/template.html",
        controller: "ArtistController"
    });
})

.controller('ArtistController', function ArtistController( $scope, SpotifyService, $routeParams ){
	
});
'use strict';

angular.module('spotmop.music.album', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/music/album/:uri", {
        templateUrl: "app/music/album/template.html",
        controller: "AlbumController"
    });
})

.controller('AlbumController', function AlbumController( $scope, SpotifyService, $routeParams ){
	
});
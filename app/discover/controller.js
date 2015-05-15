'use strict';

angular.module('spotmop.discover', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider
		.when("/discover", {
			templateUrl: "app/discover/template.html",
			controller: "DiscoverController"
		})
		.when("/discover/category/:categoryid", {
			templateUrl: "app/discover/category.template.html",
			controller: "CategoryController"
		})
		.when("/discover/category/:categoryid/playlist/:playlisturi", {
			templateUrl: "app/common/playlist.template.html",
			controller: "PlaylistController"
		});
})

.controller('DiscoverController', function DiscoverController( $scope, SpotifyService ){
	
	$scope.categories = [];
	
	SpotifyService.discoverCategories()
		.success(function( response ) {
			$scope.categories = response.categories.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
})

.controller('CategoryController', function CategoryController( $scope, SpotifyService, $routeParams ){
	
	$scope.category = {};
	$scope.playlists = [];
	
	SpotifyService.getCategory( $routeParams.categoryid )
		.success(function( response ) {
			$scope.category = response;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
	SpotifyService.getCategoryPlaylists( $routeParams.categoryid )
		.success(function( response ) {
			$scope.playlists = response.playlists;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
});
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
		});
})

.controller('DiscoverController', function DiscoverController( $scope, $rootScope, SpotifyService ){
	
	$scope.categories = [];
	
	SpotifyService.discoverCategories()
		.success(function( response ) {
			$scope.categories = response.categories.items;
			$rootScope.$broadcast('spotmop:pageUpdated');
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
})

.controller('CategoryController', function CategoryController( $scope, $rootScope, SpotifyService, $routeParams ){
	
	$scope.category = {};
	$scope.playlists = [];
	
	SpotifyService.getCategory( $routeParams.categoryid )
		.success(function( response ) {
			$scope.category = response;
			$rootScope.$broadcast('spotmop:pageUpdated');
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
	SpotifyService.getCategoryPlaylists( $routeParams.categoryid )
		.success(function( response ) {
			$scope.playlists = response.playlists;
			$rootScope.$broadcast('spotmop:pageUpdated');
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
});
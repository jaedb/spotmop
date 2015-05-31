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
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-categories', message: 'Loading'});
	
	SpotifyService.discoverCategories()
		.success(function( response ) {
			$scope.categories = response.categories.items;
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-categories', message: error.error.message});
        });
	
})

.controller('CategoryController', function CategoryController( $scope, $rootScope, SpotifyService, $routeParams ){
	
	$scope.category = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-category', message: 'Loading'});
	
	SpotifyService.getCategory( $routeParams.categoryid )
		.success(function( response ) {
			$scope.category = response;
	
            SpotifyService.getCategoryPlaylists( $routeParams.categoryid )
                .success(function( response ) {
                    $scope.playlists = response.playlists;
                    $rootScope.$broadcast('spotmop:pageUpdated');
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
                })
                .error(function( error ){
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
                    $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-category', message: error.error.message});
                });
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-category', message: error.error.message});
        });
	
});
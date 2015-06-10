'use strict';

angular.module('spotmop.discover', [])

/**
 * Routing 
 **/
.config(function($stateProvider){
	
	$stateProvider
		.state('discover', {
			url: "/discover",
			templateUrl: "app/discover/template.html"
		})
		.state('discover.browse', {
			url: "/browse",
			templateUrl: "app/discover/browse.template.html",
			controller: 'DiscoverController'
		})
		.state('discover.category', {
			url: "/category/:categoryid",
			templateUrl: "app/discover/category.template.html",
			controller: 'CategoryController'
		});
})
	
/**
 * Main controller
 **/
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
	
/**
 * Category controller
 **/
.controller('CategoryController', function CategoryController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.category = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-category', message: 'Loading'});
	
	SpotifyService.getCategory( $stateParams.categoryid )
		.success(function( response ) {
			$scope.category = response;
	
            SpotifyService.getCategoryPlaylists( $stateParams.categoryid )
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
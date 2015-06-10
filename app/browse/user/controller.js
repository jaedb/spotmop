'use strict';

angular.module('spotmop.browse.user', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.user', {
			url: "/user/:uri",
			templateUrl: "app/browse/user/template.html",
			controller: 'UserController'
		});
})
	
/**
 * Main controller
 **/
.controller('UserController', function UserController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.user = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-user', message: 'Loading'});
	
	// get the user
	SpotifyService.getUser( $stateParams.uri )
		.success(function( response ) {
			$scope.user = response;
        
            // get their playlists
            SpotifyService.getPlaylists( response.id )
                .success(function( response ) {
                    $scope.playlists = response;
					$rootScope.$broadcast('spotmop:pageUpdated');
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
                })
                .error(function( error ){
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
                    $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-user', message: error.error.message});
                });
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-user', message: error.error.message});
        });
});
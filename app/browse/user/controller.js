'use strict';

angular.module('spotmop.browse.user', [
    'ngRoute'
])

.config(function($routeProvider) {
    $routeProvider.when("/browse/user/:uri", {
        templateUrl: "app/browse/user/template.html",
        controller: "UserController"
    });
})

.controller('UserController', function UserController( $scope, $rootScope, SpotifyService, $routeParams ){
	
	$scope.user = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-user', message: 'Loading'});
	
	// get the user
	SpotifyService.getUser( $routeParams.uri )
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
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
	
	// get the user
	SpotifyService.getUser( $routeParams.uri )
		.success(function( response ) {
			$scope.user = response;
        
            // get their playlists
            SpotifyService.getPlaylists( response.id )
                .success(function( response ) {
                    $scope.playlists = response;
					$rootScope.$broadcast('spotmop:pageUpdated');
                })
                .error(function( error ){
                    $scope.status = 'Unable to load users playlists';
                });
		})
		.error(function( error ){
			$scope.status = 'Unable to load user';
		});
});
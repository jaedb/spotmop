angular.module('spotmop.discover.new', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('discover.new', {
			url: "/new",
			templateUrl: "app/discover/new/template.html",
			controller: 'NewController'
		});
})
	
/**
 * Main controller
 **/
.controller('NewController', function NewController( $scope, $rootScope, SpotifyService ){
	
	// set the default items
	$scope.albums = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-new-releases', message: 'Loading'});
	
	SpotifyService.newReleases()
		.success(function( response ) {
			$scope.albums = response.albums.items;
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-new-releases'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-new-releases'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-new-releases', message: error.error.message});
        });
	
});
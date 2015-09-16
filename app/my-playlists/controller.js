angular.module('spotmop.myplaylists', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('myplaylists', {
			url: "/my-playlists",
			templateUrl: "app/my-playlists/template.html",
			controller: 'MyPlaylistsController'
		});
})
	
/**
 * Main controller
 **/
.controller('MyPlaylistsController', function MyPlaylistsController( $scope, $rootScope, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page
	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
	
	$scope.$broadcast('spotmop:pageUpdated');
	
});
angular.module('spotmop.playlists', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('playlists', {
			url: "/playlists",
			templateUrl: "app/playlists/template.html",
			controller: 'PlaylistsController'
		});
})
	
/**
 * Main controller
 **/
.controller('PlaylistsController', function PlaylistsController( $scope, $rootScope, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page
	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
});
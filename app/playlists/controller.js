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
		})
		.state('playlists.my', {
			url: "/my",
			templateUrl: "app/playlists/my.template.html"
		})
		.state('playlists.following', {
			url: "/following",
			templateUrl: "app/playlists/following.template.html"
		});
})

	
/**
 * Main controller
 **/
.controller('PlaylistsController', function PlaylistsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page
	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
});



angular.module('spotmop.playlists', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {		
	$stateProvider
		.state('playlists', {
			url: "/playlists",
			templateUrl: "app/playlists/template.html"
		})
		.state('playlists.my', {
			url: "/my",
			templateUrl: "app/playlists/my.template.html",
			controller: 'MyPlaylistsController'
		})
		.state('playlists.following', {
			url: "/following",
			templateUrl: "app/playlists/following.template.html",
			controller: 'FollowingPlaylistsController'
		});
})

	
/**
 * Main controller
 **/
.controller('MyPlaylistsController', function PlaylistsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page
	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
})

	
/**
 * Main controller
 **/
.controller('FollowingPlaylistsController', function PlaylistsController( $scope, $rootScope, SpotifyService, SettingsService, DialogService ){
	
	// note: we use the existing playlist list to show playlists on this page
	
	$scope.createPlaylist = function(){
        DialogService.create('createPlaylist', $scope);
	}
});
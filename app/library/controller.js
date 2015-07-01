angular.module('spotmop.library', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('library', {
			url: "/library",
			templateUrl: "app/library/template.html",
			controller: 'LibraryController'
		});
})
	
/**
 * Main controller
 **/
.controller('LibraryController', function PlaylistsController( $scope, $rootScope, SpotifyService, SettingsService, DialogService ){
	  
	$scope.tracks;
	
    // if we've got a userid already in storage, use that
    var userid = SettingsService.getSetting('spotifyuserid',$scope.$parent.spotifyUser.id);
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-library', message: 'Loading'});
    
	SpotifyService.getMyTracks( userid )
		.then(
			function( response ){ // successful
				$scope.tracks = response.data;
				$rootScope.$broadcast('spotmop:pageUpdated');
				$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-library'});
			},
			function( response ){ // error
			
				// if it was 401, refresh token
				if( error.error.status == 401 )
					Spotify.refreshToken();
			
				$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-library'});
				$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-library', message: error.error.message});
			}
		);
	
});
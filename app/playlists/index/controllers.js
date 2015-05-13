
// build the main menu
app.controller('PlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.items = [];
	
	Spotify.MyPlaylists()
		.success(function( response ) {
			$scope.items = response.items;
		})
		.error(function( error ){
			
			// if it was 401, refresh token
			if( error.error.status == 401 )
				Spotify.refreshToken();
		
			$scope.status = 'Unable to load your playlists: ' + error.message;
		});
	
}]);
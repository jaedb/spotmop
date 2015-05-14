
// build the main menu
app.controller('PlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.playlists = [];
	
	Spotify.MyPlaylists()
		.success(function( response ) {
			$scope.playlists = response.items;
		})
		.error(function (error) {
			$scope.status = 'Unable to load your playlists: ' + error.message;
		});
	
}]);
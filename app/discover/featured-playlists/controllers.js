
// build the main menu
app.controller('DiscoverFeaturedPlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.playlists = [];
	
	Spotify.FeaturedPlaylists()
		.success(function( response ) {
			$scope.playlists = response.playlists.items;
		})
		.error(function (error) {
			$scope.status = 'Unable to load featured playlists: ' + error.message;
		});
	
}]);
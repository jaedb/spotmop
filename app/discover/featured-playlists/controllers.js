
// build the main menu
app.controller('DiscoverFeaturedPlaylistsController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.items = [];
	
	Spotify.FeaturedPlaylists()
		.success(function( response ) {
			$scope.items = response.playlists.items;
			console.log( $scope.items );
		})
		.error(function (error) {
			$scope.status = 'Unable to load featured playlists: ' + error.message;
		});
	
}]);
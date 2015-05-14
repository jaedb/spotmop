
// build the main menu
app.controller('DiscoverNewReleasesController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.albums = [];
	
	Spotify.NewReleases()
		.success(function( response ) {
			$scope.albums = response.albums.items;
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
}]);
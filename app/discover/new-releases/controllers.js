
// build the main menu
app.controller('DiscoverNewReleasesController', ['$scope', 'Spotify', function( $scope, Spotify ){
	
	// set the default items
	$scope.items = [];
	
	Spotify.NewReleases()
		.success(function( response ) {
			$scope.items = response.albums.items;
		})
		.error(function (error) {
			$scope.status = 'Unable to load new releases: ' + error.message;
		});
	
}]);
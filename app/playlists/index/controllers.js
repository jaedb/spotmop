
// build the main menu
app.controller('PlaylistsController', function( $scope, Spotify ){
	
	// set the default items
	$scope.items = [];
	
	//
	$scope.GetPlaylists = function GetPlaylists(){
		Spotify.getCustomers()
			.success(function (custs) {
				$scope.items = custs;
			})
			.error(function (error) {
				$scope.status = 'Unable to load customer data: ' + error.message;
			});
	}
	
});

// build the main menu
app.controller('MainMenu', ['$scope', function( $scope ){
	
	var items = $scope.items = [
		{
			Title: 'Queue',
			Link: 'queue'
		},
		{
			Title: 'Discover',
			Link: 'discover',
			Children: [
				{ 
					Title: 'Featured playlists',
					Link: 'discover/featured-playlists'
				},
				{ 
					Title: 'New releases',
					Link: 'discover/new-releases'
				}
			]
		},
		{
			Title: 'Playlists',
			Link: 'playlists'
		}
	];
	
}]);


// handle services
app.controller('Services', function( $scope, Mopidy, Spotify ){
	
	$scope.MopidyStatus = Mopidy.Online;	
	$scope.SpotifyStatus = Spotify.Online;
	
});
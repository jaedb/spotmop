
// build the main menu
app.controller('MainMenu', function( $scope ){
	
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
	
});
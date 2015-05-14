
// build the main menu
app.controller('MainMenu', ['$scope', function( $scope ){
	
	var items = $scope.items = [
		{
			Title: 'Queue',
			Link: 'queue',
			Icon: 'list'
		},
		{
			Title: 'Discover',
			Link: 'discover',
			Icon: 'star',
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
			Link: 'playlists',
			Icon: 'folder-open'
		},
		{
			Title: 'Settings',
			Link: 'settings',
			Icon: 'cog'
		}
	];
	
}]);


// handle services
app.controller('Services', function( $rootScope, $scope, AppState ){
	/*
	$scope.MopidyOnline = false;	
	$scope.SpotifyOnline = AppState.Spotify;
	
	$scope.$on('Mopidy:ConnectionChange', function(event, data){
		$scope.MopidyOnline = data;
	});
	*/
	
	
});









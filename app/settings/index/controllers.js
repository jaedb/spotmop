
// build the main menu
app.controller('SettingsController', ['$scope', '$localStorage', 'Mopidy', 'Spotify', function( $scope, $localStorage, Mopidy, Spotify ){
	
	// load data (either blanks, or from local storage)
	$scope.MopidySettings = $localStorage.Settings.Mopidy;
	
	// save the fields to the localStorage
	$scope.SaveFields = function( evt ){
		$localStorage.Settings.Mopidy = $scope.MopidySettings;
	};
	
}]);
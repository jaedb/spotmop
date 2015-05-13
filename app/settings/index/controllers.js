
// build the main menu
app.controller('SettingsController', ['$scope', '$localStorage', 'Mopidy', 'Spotify', function( $scope, $localStorage, Mopidy, Spotify ){
	
	// make sure we have a settings container
	if( typeof( $localStorage.Settings ) === 'undefined' )
		$localStorage.Settings = [];
	
	// and a MopidySettings container
	if( typeof( $localStorage.Settings.MopidySettings ) === 'undefined' ){
		$scope.MopidySettings = {
			Hostname: 'localhost',
			Port: '6680',
			CountryCode: 'NZ',
			Locale: 'en_NZ'
		};
	}
	
	// load data (either blanks, or from local storage)
	$scope.MopidySettings = $localStorage.Settings.Mopidy;
	
	// save the fields to the localStorage
	$scope.SaveFields = function( evt ){
		$localStorage.Settings.Mopidy = $scope.MopidySettings;
	};
	
}]);
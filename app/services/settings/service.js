/**
 * Create a Settings service
 *
 * This holds all of the calls for system settings, local storage included
 **/
 
angular.module('spotmop.services.settings', [])

.factory("SettingsService", ['$rootScope', '$localStorage', '$interval', '$http', function( $rootScope, $localStorage, $interval, $http ){
	
	// make sure we have a settings container
	if( typeof( $localStorage.settings ) === 'undefined' )
		$localStorage.settings = {};
	
	// setup response object
	return {
		
		setSetting: function( $setting, $value ){
			$localStorage.settings.$setting = $value;
		},
		
		getSetting: function( $setting, $default ){	
			if( typeof($localStorage.settings[$setting]) !== 'undefined' )
				return $localStorage.settings[$setting];
			return $default;
		},
		
		getSettings: function(){
			return $localStorage.settings;
		},
		
		getVersion: function(){
			return $http({
				method: 'GET',
				url: 'app/services/settings/version.php'
			});	
		}
	};
	
}]);






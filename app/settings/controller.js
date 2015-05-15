'use strict';

angular.module('spotmop.settings', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/settings", {
        templateUrl: "app/settings/template.html",
        controller: "SettingsController"
    });
})
	
.controller('SettingsController', function SettingsController( $scope, $localStorage ){

	// load data (either blanks, or from local storage)
	$scope.MopidySettings = $localStorage.Settings.Mopidy;
	
	// save the fields to the localStorage
	$scope.SaveFields = function( evt ){
		$localStorage.Settings.Mopidy = $scope.MopidySettings;
	};
	
});
'use strict';

angular.module('spotmop.settings', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
	/*
    $routeProvider.when("/account/settings", {
        templateUrl: "account/settings/settings.tmpl.html",
        controller: "SettingsController"
    });*/
})
	
.controller('SettingsController', ['$scope', '$localStorage', 'MopidyService', 'Spotify', function( $scope, $localStorage, MopidyService, Spotify ){
	
	// load data (either blanks, or from local storage)
	$scope.MopidySettings = $localStorage.Settings.Mopidy;
	
	// save the fields to the localStorage
	$scope.SaveFields = function( evt ){
		$localStorage.Settings.Mopidy = $scope.MopidySettings;
	};
	
}]);

angular.module('spotmop.queue', [
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
	
.controller('QueueController', function QueueController( $scope ){
	
	$scope.Tracklist = false;
	
});
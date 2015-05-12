

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
var app = angular.module('App', [
	
	// list all our required dependencies
	'ngRoute'
]);




/* =========================================================================== ROUTING ======== */
/* ============================================================================================ */

// setup all the pages we require
app.config(function($locationProvider, $routeProvider) {
	
	// use the HTML5 History API
	$locationProvider.html5Mode(true);
	
	$routeProvider
		.when('/queue', {
			templateUrl : '/app/queue/template.html',
			controller  : 'QueueController'
		})
		.when('/discover', {
			templateUrl : '/app/discover/template.html',
			controller  : 'DiscoverController'
		});
});
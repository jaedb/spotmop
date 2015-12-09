'use strict';

angular.module('spotmop.browse', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse', {
			url: "/browse",
			templateUrl: "app/browse/template.html"
		});
});


/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
var app = angular.module('App', [
	
	// list all our required dependencies
	'ngRoute',
	'ngResource',
	'ngStorage'
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
			templateUrl : '/app/discover/index/template.html',
			controller  : 'DiscoverController'
		})
		.when('/discover/featured-playlists', {
			templateUrl : '/app/discover/featured-playlists/template.html',
			controller  : 'DiscoverFeaturedPlaylistsController'
		})
		.when('/discover/new-releases', {
			templateUrl : '/app/discover/new-releases/template.html',
			controller  : 'DiscoverNewReleasesController'
		})
		.when('/playlists', {
			templateUrl : '/app/playlists/index/template.html',
			controller  : 'PlaylistsController'
		});
});




/* =========================================================================== RESOURCES ====== */
/* ============================================================================================ */


/**
 * Create a Mopidy service
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
app.factory("Mopidy", ['$q', '$rootScope', '$resource', '$http', function($q, $rootScope, $resource, $http ){
	
	var consoleError = function(){ console.error.bind(console); };	
	var mopidy = new Mopidy({
		webSocketUrl: "ws://192.168.0.112:6680/mopidy/ws"
	});
	
	// when mopidy goes online
	mopidy.on("state:online", function(){
		Online = true;
	});
	
	// setup the returned object
    return {
		Online: false,		
		Tracklist: [],		
		getTracklist: function(){
			return mopidy.tracklist.getTracklist();
		}
	};
}]);


/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
app.factory("Spotify", function( $resource, $http ){
	
    var urlBase = 'https://api.spotify.com/v1/';
	
	/*
    dataFactory.MyPlaylists = function(){
        return $http.get(urlBase);
    };

    dataFactory.insertCustomer = function( cust ){
        return $http.post(urlBase, cust);
    };*/
	
	// setup response object
    return {
		
		Online: false,
		
		MyPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'users/jaedb/playlists',
				headers: {
					Authorization: 'Bearer BQCeuK6tk1VoJ8FRU4-e5_GHoTRNDz_6Ntd7ulRLLUvOgZqI_dHm1SYjSsUnkz2TilA3bC1HfbAg-kpxrNVIqQGeudit4lzXOtZCvGFRKk5U5VzlaS9rjWytIYPqYMI3ek7zYTbu1P6g-F_nnnlFZYVPnqxD9Uzx_odfIP_AW_FcY-FGECHg_-JpOe6GJjRqTzWcMh3wbFJYtGTEQ71nxl8hDmny048o95OPZSAfnsHvJgH8'
				}
			});
		},
		
		FeaturedPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/featured-playlists',
				headers: {
					Authorization: 'Bearer BQCeuK6tk1VoJ8FRU4-e5_GHoTRNDz_6Ntd7ulRLLUvOgZqI_dHm1SYjSsUnkz2TilA3bC1HfbAg-kpxrNVIqQGeudit4lzXOtZCvGFRKk5U5VzlaS9rjWytIYPqYMI3ek7zYTbu1P6g-F_nnnlFZYVPnqxD9Uzx_odfIP_AW_FcY-FGECHg_-JpOe6GJjRqTzWcMh3wbFJYtGTEQ71nxl8hDmny048o95OPZSAfnsHvJgH8'
				}
			});
		},
		
		NewReleases: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/new-releases',
				headers: {
					Authorization: 'Bearer BQCeuK6tk1VoJ8FRU4-e5_GHoTRNDz_6Ntd7ulRLLUvOgZqI_dHm1SYjSsUnkz2TilA3bC1HfbAg-kpxrNVIqQGeudit4lzXOtZCvGFRKk5U5VzlaS9rjWytIYPqYMI3ek7zYTbu1P6g-F_nnnlFZYVPnqxD9Uzx_odfIP_AW_FcY-FGECHg_-JpOe6GJjRqTzWcMh3wbFJYtGTEQ71nxl8hDmny048o95OPZSAfnsHvJgH8'
				}
			});
		}
		
	};
});






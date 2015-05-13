

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
var app = angular.module('App', [
	
	// list all our required dependencies
	'ngRoute',
	'ngResource'
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
app.factory("Mopidy", function($q, $rootScope, $resource, $http ){
	
	var consoleError = function(){ console.error.bind(console); };
	
	var dataFactory = {
		Online: false,
		Queue: {
			Tracks: null,
			CurrentTrack: null
		}
	};
	
	var mopidy = new Mopidy({
		webSocketUrl: "ws://192.168.0.112:6680/mopidy/ws"
	});
	
	// when mopidy goes online
	mopidy.on("state:online", function(){
		
		// set the flag
		dataFactory.Online = true;
		
		// fetch the queue
		mopidy.tracklist.getTracks().then( function( response ){
			dataFactory.Queue.Tracks = response;
		}, consoleError );
	});
	
    return dataFactory;
});


/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
app.factory("Spotify", function( $resource, $http ){
	
    var urlBase = 'http://jsonplaceholder.typicode.com/posts/';
    var dataFactory = {
		AccessToken: null
	};
	
    dataFactory.MyPlaylists = function(){
        return $http.get(urlBase);
    };

    dataFactory.insertCustomer = function( cust ){
        return $http.post(urlBase, cust);
    };
	
    return dataFactory;
});






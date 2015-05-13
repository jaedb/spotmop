

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
		})
		.when('/settings', {
			templateUrl : '/app/settings/index/template.html',
			controller  : 'SettingsController'
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
		webSocketUrl: "ws://pi.barnsley.nz:6680/mopidy/ws"
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
app.factory("Spotify", ['$resource', '$localStorage', '$http', function( $resource, $localStorage, $http ){
	
	// set container for spotify storage
	if( typeof($localStorage.Spotify) === 'undefined' )
		$localStorage.Spotify = {};
		
	if( typeof($localStorage.Spotify.AccessToken) === 'undefined' )
		$localStorage.Spotify.AccessToken = null;
		
	if( typeof($localStorage.Spotify.AccessTokenExpiry) === 'undefined' )
		$localStorage.Spotify.AccessTokenExpiry = null;
		
	if( typeof($localStorage.Spotify.ClientID) === 'undefined' )
		$localStorage.Spotify.ClientID = 'a87fb4dbed30475b8cec38523dff53e2';
	
	//if( $localStorage.Spotify.AccessToken === 'null' ){
		getAuthorizationCode();
	//}
	
	/*
	 * Get a Spotify API authorisation code
	*/
	function getAuthorizationCode(){
		
		// save current URL, before we redirect
		localStorage.returnURL = window.location.href;
		
		var newURL = '';
		newURL += 'https://accounts.spotify.com/authorize?client_id='+$localStorage.Spotify.ClientID;
		newURL += '&redirect_uri='+window.location.protocol+'//'+window.location.host+'/app/services/spotify/authenticate.php';
		newURL += '&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private%20playlist-modify-private';
		newURL += '&response_type=code&show_dialog=true';
		
		// open a new window to handle this authentication
		window.open(newURL,'spotifyAPIrequest','height=550,width=400');
	}
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	
	// setup response object
    return {
		
		Online: false,
		
		MyPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'users/jaedb/playlists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		FeaturedPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/featured-playlists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		NewReleases: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/new-releases',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		}
		
	};
}]);








/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
var app = angular.module('App', [
	
	// list all our required dependencies
	'ngRoute',
	'ngResource',
	'ngStorage'
]);

/**
 * Global controller
 **/
app.controller('AppController', ['$scope', '$rootScope', '$localStorage', 'MopidyService', 'Spotify', function( $scope, $rootScope, $localStorage, MopidyService, Spotify ){


	$scope.Mopidy = {};
	$scope.Mopidy.Online = false;
	$scope.Mopidy.CurrentTracklist = {};
	
	// listen for connection changes to the Mopidy API
	$scope.$on('mopidy:connectionChanged', function( data ){
		$scope.Mopidy.Online = data;
	});	
	
	// listen for track changes
	$scope.$on('mopidy:tracklistChanged', function( data ){
		$scope.Mopidy.CurrentTracklist = data;
	});	
	
	if( typeof($localStorage.Settings) === 'undefined' || typeof($localStorage.Settings) === 'null' )
		$localStorage.Settings = {};
		
	if( typeof($localStorage.Settings.Mopidy) === 'undefined' || typeof($localStorage.Settings.Mopidy) === 'null' )
		$localStorage.Settings.Mopidy = {
			Hostname: 'localhost',
			Port: '6680',
			CountryCode: 'NZ',
			Locale: 'en_NZ'
		};
	
}]);


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
app.factory("MopidyService", ['$q', '$rootScope', '$resource', '$localStorage', '$http', '$timeout', function($q, $rootScope, $resource, $localStorage, $http, $timeout ){
	
	// fetch the settings
	var Settings = $localStorage.Settings.Mopidy;
	
	var consoleError = function(){ console.error.bind(console); };
	
	$rootScope.mopidy = new Mopidy({
		webSocketUrl: "ws://"+Settings.Hostname+":"+Settings.Port+"/mopidy/ws"
	});
	
	var state = 'offline';
	
	// when mopidy goes online
	$rootScope.mopidy.on("state:online", function(){
		
		// include timeout, this prevents $apply already in progress (if this event is fired on app init)
		$timeout(function() {
			$rootScope.$broadcast('mopidy:connectionChanged', true);
			$rootScope.$apply;
		}, 0);
	});
	
	// when mopidy goes offline
	$rootScope.mopidy.on("state:offline", function(){
		
		// include timeout, this prevents $apply already in progress (if this event is fired on app init)
		$timeout(function() {
			$rootScope.$broadcast('mopidy:connectionChanged', false);
			$rootScope.$apply;
		}, 0);
	});
	
	// when mopidy goes offline
	$rootScope.mopidy.on("event:tracklistChanged", function(){
		
		$rootScope.mopidy.tracklist.getTracklist().then( function( tracklist ){
			// include timeout, this prevents $apply already in progress (if this event is fired on app init)
			$timeout(function() {
				$rootScope.$broadcast('mopidy:tracklistChanged', tracklist);
				$rootScope.$apply;
			}, 0);
		});
	});
	
	// setup the returned object
    return {	
		getState: function(){
			return state;
		},	
		setState: function( value ){
			state = value;
		},
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
app.factory("Spotify", ['$rootScope', '$resource', '$localStorage', '$http', function( $rootScope, $resource, $localStorage, $http ){
	console.log( $localStorage );
	// set container for spotify storage
	if( typeof($localStorage.Spotify) === 'undefined' )
		$localStorage.Spotify = {};
		
	if( typeof($localStorage.Spotify.AccessToken) === 'undefined' )
		$localStorage.Spotify.AccessToken = null;
		
	if( typeof($localStorage.Spotify.RefreshToken) === 'undefined' )
		$localStorage.Spotify.RefreshToken = null;
		
	if( typeof($localStorage.Spotify.AuthorizationCode) === 'undefined' )
		$localStorage.Spotify.AuthorizationCode = null;
		
	if( typeof($localStorage.Spotify.AccessTokenExpiry) === 'undefined' )
		$localStorage.Spotify.AccessTokenExpiry = null;
		
	if( typeof($localStorage.Spotify.ClientID) === 'undefined' )
		$localStorage.Spotify.ClientID = 'a87fb4dbed30475b8cec38523dff53e2';
	
	if( !$localStorage.Spotify.AuthorizationCode )
		getAuthorizationCode();

	if( !$localStorage.Spotify.AccessToken || $localStorage.Spotify.AccessTokenExpiry < new Date().getTime() )
		getNewToken();
	
	// Get a Spotify API authorisation code
	// This is only needed once for this account on this device. It is used to acquire access tokens (which expire)
	function getAuthorizationCode(){
		
		// save current URL, before we redirect
		localStorage.returnURL = window.location.href;
		
		var newURL = '';
		newURL += 'https://accounts.spotify.com/authorize?client_id='+$localStorage.Spotify.ClientID;
		newURL += '&redirect_uri='+window.location.protocol+'//'+window.location.host+'/spotify.php?authorization';
		newURL += '&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private%20playlist-modify-private';
		newURL += '&response_type=code&show_dialog=true';
		
		// open a new window to handle this authentication
		window.open(newURL,'spotifyAPIrequest','height=550,width=400');
	}
	
	// get a new access token
	// these expire, so require frequent refreshing
	function getNewToken(){		
		return $.ajax({
			url: '/spotify.php?refresh_token='+$localStorage.Spotify.RefreshToken,
			type: "GET",
			dataType: "json",
			async: false,
			timeout: 5000,
			success: function(response){
				$localStorage.Spotify.AccessToken = response.access_token;
				$localStorage.Spotify.AccessTokenExpiry = new Date().getTime() + 3600000;
			},
			fail: function(response){
				notifyUser('bad','There was a problem connecting to Spotify: '+response.responseJSON.error.message);
			}
		});
	}
	
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	
	// setup response object
    return {
		
		getNewToken: getNewToken(),
		
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






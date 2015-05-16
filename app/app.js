

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
angular.module('spotmop', [
	
	// list all our required dependencies
	'ngRoute',
	'ngResource',
	'ngStorage',
	
	'spotmop.queue',
	'spotmop.settings',
	'spotmop.playlists',
	
	'spotmop.music.playlist',
	'spotmop.music.tracklist',
	
	'spotmop.discover',
	'spotmop.discover.featured',
	'spotmop.discover.new'
])


/* =========================================================================== ROUTING ======== */
/* ============================================================================================ */

// setup all the pages we require
.config(function($locationProvider, $routeProvider) {
	
	// use the HTML5 History API
	$locationProvider.html5Mode(true);
})



/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $localStorage, SpotifyService, $timeout ){

	$scope.test = [{wheel: 'bob'}];

	$scope.playlists = [];
	var getPlaylists = function(){
		return $scope.playlists;
	};
	var setPlaylists = function( playlists ){
		$scope.playlists = playlists;
	};
	
	$scope.mainMenu = [
		{
			Title: 'Queue',
			Link: 'queue',
			Icon: 'list'
		},
		{
			Title: 'Discover',
			Link: 'discover',
			Icon: 'star',
			Children: [
				{ 
					Title: 'Featured playlists',
					Link: 'discover/featured'
				},
				{ 
					Title: 'New releases',
					Link: 'discover/new'
				}
			]
		},
		{
			Title: 'Playlists',
			Link: 'playlists',
			Icon: 'folder-open',
			Children: null
		},
		{
			Title: 'Settings',
			Link: 'settings',
			Icon: 'cog'
		}
	];
	

	if( typeof($localStorage.Settings) === 'undefined' || typeof($localStorage.Settings) === 'null' )
		$localStorage.Settings = {};
		
	if( typeof($localStorage.Settings.Mopidy) === 'undefined' || typeof($localStorage.Settings.Mopidy) === 'null' )
		$localStorage.Settings.Mopidy = {
			Hostname: 'localhost',
			Port: '6680',
			CountryCode: 'NZ',
			Locale: 'en_NZ'
		};
	
	SpotifyService.myPlaylists()
		.success(function( response ) {
			
			var sanitizedPlaylists = [];
			
			// loop all of our playlists, and set up a menu item for each
			$.each( response.items, function( key, playlist ){
			
				// we only want to add playlists that this user owns
				if( playlist.owner.id == 'jaedb' ){
					sanitizedPlaylists.push({
						Title: playlist.name,
						Link: playlist.uri
					});
				}
			});
			
			// now loop the main menu to find our Playlist menu item
			for(var i in $scope.mainMenu ){
				if( $scope.mainMenu[i].Link == 'playlists'){
					// inject our new menu children
					$scope.mainMenu[i].Children = sanitizedPlaylists;
					break; //Stop this loop, we found it!
				}
			}
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
})


/* =========================================================================== RESOURCES ====== */
/* ============================================================================================ */




/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', function( $rootScope, $resource, $localStorage, $http, $interval ){

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

	// on load, get a new token
	// this means we [easily] know how long it's been since last refreshed
	getNewToken();
	
	// setup automatic refreshing too (spotify refreshes every hour)
	$interval( getNewToken, 3500000 );
	
	/**
	 * Get a Spotify API authorisation code
	 * This is only needed once for this account on this device. It is used to acquire access tokens (which expire)
	 **/
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
	
	/**
	 * Get a new access token
	 * These expire, so require frequent refreshing
	 **/
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
	
	/**
	 * Get an element from a URI
	 * @param element = string, the element we wish to extract
	 * @param uri = string
	 **/
	function getFromURI( element, uri ){
		var exploded = uri.split(':');
		
		if( element == 'userid' && exploded[1] == 'user' )
			return exploded[2];
			
		if( element == 'playlistid' && exploded[3] == 'playlist' )
			return exploded[4];
			
		return null;
	}
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	
	// setup response object
    return {
		myPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'users/jaedb/playlists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		featuredPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/featured-playlists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		newReleases: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/new-releases',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		discoverCategories: function(){
			return $http({
				method: 'GET',
				url: urlBase+'browse/categories',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getCategory: function( categoryid ){
			return $http({
				method: 'GET',
				url: urlBase+'browse/categories/'+categoryid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getCategoryPlaylists: function( categoryid ){
			return $http({
				method: 'GET',
				url: urlBase+'browse/categories/'+categoryid+'/playlists?limit=50',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getPlaylist: function( playlisturi ){
		
			// get the user and playlist ids from the uri
			var userid = getFromURI( 'userid', playlisturi );
			var playlistid = getFromURI( 'playlistid', playlisturi );
		
			return $http({
				method: 'GET',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		}
	};
}]);






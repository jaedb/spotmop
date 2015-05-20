/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.spotify', [])

.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout ){

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
	
	// setup automatic refreshing (tokens last for 3600 seconds, so let's refresh every 3500 seconds)
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
				$rootScope.spotifyOnline = true;
			},
			fail: function(response){
				notifyUser('bad','There was a problem connecting to Spotify: '+response.responseJSON.error.message);
				$rootScope.spotifyOnline = false;
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
			
		if( element == 'artistid' && exploded[1] == 'artist' )
			return exploded[2];
			
		if( element == 'albumid' && exploded[1] == 'album' )
			return exploded[2];
			
		if( element == 'trackid' && exploded[1] == 'track' )
			return exploded[2];
			
		return null;
	}
	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	
	// setup response object
    return {
	
		getTrack: function( trackuri ){
		
			var trackid = getFromURI('trackid', trackuri);
			
			return $http({
				method: 'GET',
				url: urlBase+'tracks/'+trackid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
	
		/**
		 * Playlist-oriented requests
		 **/
		myPlaylists: function(){
			return $http({
				method: 'GET',
				url: urlBase+'users/jaedb/playlists',
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
		
		/**
		 * Discover
		 **/
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
		
		/**
		 * Artist
		 **/
		 
		getArtist: function( artisturi ){
		
			var artistid = getFromURI( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getAlbums: function( artisturi ){
		
			var artistid = getFromURI( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid+'/albums?album_type=album,single',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getAlbum: function( albumuri ){
		
			var albumid = getFromURI( 'albumid', albumuri );
			
			return $http({
				method: 'GET',
				url: urlBase+'albums/'+albumid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getTopTracks: function( artisturi ){
		
			var artistid = getFromURI( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid+'/top-tracks?country=NZ',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		}
	};
}]);






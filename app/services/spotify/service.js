/**
 * Create a Spotify service 
 *
 * This holds all of the Spotify API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.spotify', [])

.factory("SpotifyService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', 'SettingsService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, SettingsService ){

	// set container for spotify storage
	if( typeof($localStorage.Spotify) === 'undefined' )
		$localStorage.Spotify = {};
		
	if( typeof($localStorage.Spotify.UserID) === 'undefined' )
		$localStorage.Spotify.UserID = null;
		
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
		newURL += '&redirect_uri='+window.location.protocol+'//'+window.location.host+'/spotify-authorization';
		newURL += '&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private%20playlist-modify-private%20user-follow-read';
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
			url: '/spotify-authorization?refresh_token='+$localStorage.Spotify.RefreshToken,
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

	
	// specify the base URL for the API endpoints
    var urlBase = 'https://api.spotify.com/v1/';
	var country = SettingsService.getSetting("spotifycountry", 'NZ');
	var locale = SettingsService.getSetting("spotifylocale", "en_NZ");
	
	// setup response object
    return {
		
		logout: function(){
			$localStorage.Spotify = {};
			return true;
		},
	   
        getNewToken: function(){
            getNewToken();  
        },
        
		/**
		 * Get an element from a URI
		 * @param element = string, the element we wish to extract
		 * @param uri = string
		 **/
		getFromUri: function( element, uri ){
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
		},
        
        /**
         * Users
         **/
        
        getMe: function(){
			return $http({
				method: 'GET',
				url: urlBase+'me/',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
        },
        
        getUser: function( useruri ){
		
			var userid = this.getFromUri( 'userid', useruri );
            
			return $http({
				method: 'GET',
				url: urlBase+'users/'+userid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
        },
		
		isFollowing: function( type, uri ){
			
			var id = this.getFromUri( type+'id', uri );
		
			return $http({
				method: 'GET',
				url: urlBase+'me/following/contains?type='+type+'&ids='+id,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
        
        
        /**
         * Track based requests
         **/
	
		getTrack: function( trackuri ){
			
			var trackid = this.getFromUri('trackid', trackuri);
			
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
		getPlaylists: function( userid ){
			return $http({
				method: 'GET',
				url: urlBase+'users/'+userid+'/playlists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getPlaylist: function( playlisturi ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
		
			return $http({
				method: 'GET',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		isFollowingPlaylist: function( playlisturi, ids ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
		
			return $http({
				method: 'GET',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers/contains?ids='+ids,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		followPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
		
			return $http({
				method: 'PUT',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		unfollowPlaylist: function( playlisturi ){
			
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
		
			return $http({
				method: 'DELETE',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/followers',
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
		
		addTracksToPlaylist: function( playlisturi, tracks ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			return $http({
				method: 'POST',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
				//url: urlBase+'users/'+$localStorage.Spotify.userid+'/playlists/'+playlistid+'/tracks',
				dataType: "json",
				data: JSON.stringify( { uris: tracks } ),
				contentType: "application/json; charset=utf-8",
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		movePlaylistTracks: function( playlisturi, range_start, range_length, insert_before ){
            
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
            if( userid != SettingsService.getSetting('spotifyuserid',null) )
                return false;
			
			return $http({
				method: 'PUT',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
				dataType: "json",
				data: JSON.stringify({
                    range_start: range_start,
                    range_length: range_length,
                    insert_before: insert_before
                }),
				contentType: "application/json; charset=utf-8",
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		deleteTracksFromPlaylist: function( playlisturi, tracks ){
			
			// get the user and playlist ids from the uri
			var userid = this.getFromUri( 'userid', playlisturi );
			var playlistid = this.getFromUri( 'playlistid', playlisturi );
			
			return $http({
				method: 'DELETE',
				url: urlBase+'users/'+userid+'/playlists/'+playlistid+'/tracks',
				//url: urlBase+'users/'+$localStorage.Spotify.userid+'/playlists/'+playlistid+'/tracks',
				dataType: "json",
				data: JSON.stringify( { tracks: tracks } ),
				contentType: "application/json; charset=utf-8",
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
				url: urlBase+'browse/new-releases?country='+ country,
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
			
			var artistid = this.getFromUri( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getAlbums: function( artisturi ){
				
			var artistid = this.getFromUri( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid+'/albums?album_type=album,single&market='+country,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getAlbum: function( albumuri ){
			
			var albumid = this.getFromUri( 'albumid', albumuri );
			
			return $http({
				method: 'GET',
				url: urlBase+'albums/'+albumid,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getTopTracks: function( artisturi ){
		
			var artistid = this.getFromUri( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid+'/top-tracks?country='+country,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		getRelatedArtists: function( artisturi ){
		
			var artistid = this.getFromUri( 'artistid', artisturi );
			
			return $http({
				method: 'GET',
				url: urlBase+'artists/'+artistid+'/related-artists',
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		},
		
		/**
		 * Search results
		 * @param type = string (album|artist|track|playlist)
		 * @param query = string (search term)
		 * @param limit = int (optional)
		 **/
		getSearchResults: function( type, query, limit ){
		
			if( typeof( limit ) === 'undefined' ) limit = 10;
		
			return $http({
				method: 'GET',
				url: urlBase+'search?q='+query+'&type='+type+'&country='+country+'&limit='+limit,
				headers: {
					Authorization: 'Bearer '+ $localStorage.Spotify.AccessToken
				}
			});
		}
	};
}]);






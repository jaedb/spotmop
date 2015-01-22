/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz)
 * 
 * Integration and authentication with Spotify API
 */
 
 
function checkToken(){

	// if we don't have an authorization_code, go get one
	if( localStorage.authorization_code == null ){        
        return getAuthorizationCode();
	
	// if we don't have a token (or it has expired), go get one
	}else if( localStorage.access_token == null || localStorage.token_expiry < new Date().getTime() ){        
        return getNewToken();
    }
    
    return true;
};

/*
 * Get a Spotify API authorisation code
*/
function getAuthorizationCode(){
	
    // save current URL, before we redirect
    localStorage.returnURL = window.location.href;
	
    var newURL = '';
    newURL += 'https://accounts.spotify.com/authorize?client_id='+localStorage.settings_clientid;
    newURL += '&redirect_uri='+window.location.protocol+'//'+window.location.host+'/authenticate.php';
    newURL += '&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private&response_type=code';
    
    // open a new window to handle this authentication
    window.open(newURL,'spotifyAPIrequest','height=550,width=400');
}

/*
 * Get a new Spotify API access token
*/
function getNewToken(){

	updateLoader('start');
	
	return $.ajax({
		url: '/authenticate.php?refresh_token='+localStorage.refresh_token,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(response){
			localStorage.access_token = response.access_token;
			localStorage.token_expiry = new Date().getTime() + 3600000;
			updateLoader('stop');
		},
		fail: function(response){
			notifyUser('bad','There was a problem connecting to Spotify: '+response.responseJSON.error.message);
		}
	});
}


function getPlaylists( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbum( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbumsTracks( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'/tracks?market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtistsAlbums( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/albums?market='+localStorage.settings_country+'&album_type=album,single',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtist( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'?market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getTrack( trackID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/tracks/'+trackID+'?market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getTracks( trackIDs ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/tracks/?market='+localStorage.settings_country+'?ids='+trackID,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtists( artistIDs ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/?market='+localStorage.settings_country+'&ids='+artistIDs,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtistsTopTracks( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/top-tracks?country='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getRelatedArtists( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/related-artists?limit=10&market='+localStorage.settings_country,
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getFeaturedPlaylists(){
	return $.ajax({
		url: 'https://api.spotify.com/v1/browse/featured-playlists?market='+localStorage.settings_country+'&locale='+localStorage.settings_locale+'&country='+localStorage.settings_country,
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		timeout: 10000
	});
};

function getUsersPlaylists( userid ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+userid+'/playlists',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		timeout: 50000
	});
};

function getNewReleases(){
	return $.ajax({
		url: 'https://api.spotify.com/v1/browse/new-releases?country='+localStorage.settings_country,
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		timeout: 100000
	});
};

function getPlaylist( userID, playlistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+userID+'/playlists/'+playlistID,
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		timeout: 10000
	});
};

function getMyProfile(){
	return $.ajax({
		url: 'https://api.spotify.com/v1/me',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function getMyPlaylists(){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+localStorage.userID+'/playlists',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function createPlaylist( name ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+localStorage.userID+'/playlists',
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		data: JSON.stringify( { name: name, public: true } ),
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function addTrackToPlaylist( playlistID, trackURIs, position ){

	var position_parameter = '';
		
	if( typeof(position) !== 'undefined' )
		position_parameter += '?position='+position;	
		
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+localStorage.userID+'/playlists/'+playlistID+'/tracks'+position_parameter,
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		data: JSON.stringify( { uris: trackURIs } ),
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function replaceTracksInPlaylist( playlistID, trackURIs ){
		
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+localStorage.userID+'/playlists/'+playlistID+'/tracks',
		type: "PUT",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		data: JSON.stringify( { uris: trackURIs } ),
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function removeTracksFromPlaylist( playlistID, trackURIs ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+localStorage.userID+'/playlists/'+playlistID+'/tracks',
		type: "DELETE",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		dataType: "json",
		data: JSON.stringify( { tracks: trackURIs } ),
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function getSearchResults( type, query ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/search?type='+type+'&limit=10&q='+query,
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.access_token
		},
		timeout: 5000
	});
};





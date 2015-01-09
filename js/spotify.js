/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz)
 * 
 * Integration and authentication with Spotify API
 */

// extend on configuration
spotifyAPI.token = '';
spotifyAPI.token_expiry = '';

function checkToken(){
	
	// if we don't have a token (or it has expired), go get one
	if( localStorage.token == null || localStorage.token_expiry < new Date().getTime() ){        
        getNewToken();
        return false;
    }
    
    return true;
};

/*
 * Get a new Spotify API token
*/
function getNewToken(){
	
    // save current URL, before we redirect
    localStorage.returnURL = window.location.href;

    var newURL = '';
    newURL += 'https://accounts.spotify.com/authorize?client_id='+settings.clientid;
    newURL += '&redirect_uri='+spotifyAPI.referrer;
    newURL += '&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private&response_type=token';
    
    // open a new window to handle this authentication
    window.open(newURL,'spotifyAPIrequest','height=550,width=400');
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

// TODO: Add dynamic country code
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
			'Authorization': 'Bearer ' + localStorage.token
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
			'Authorization': 'Bearer ' + localStorage.token
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
			'Authorization': 'Bearer ' + localStorage.token
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
			'Authorization': 'Bearer ' + localStorage.token
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
			'Authorization': 'Bearer ' + localStorage.token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function getMyPlaylists(){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + localStorage.token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function createPlaylist( name ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists',
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + localStorage.token
		},
		data: JSON.stringify( { name: name, public: true } ),
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function addTrackToPlaylist( playlistID, trackURI ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists/'+playlistID+'/tracks?uris='+trackURI,
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + localStorage.token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function removeTracksFromPlaylist( playlistID, trackURIs ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists/'+playlistID+'/tracks',
		type: "DELETE",
		headers: {
			'Authorization': 'Bearer ' + localStorage.token
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
			'Authorization': 'Bearer ' + localStorage.token
		},
		timeout: 5000
	});
};





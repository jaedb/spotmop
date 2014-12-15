/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz)
 * 
 * Integration and authentication with Spotify API
 */

// extend on configuration
spotifyAPI.token = '';
spotifyAPI.token_expiry = '';
spotifyAPI.artist = "https://api.spotify.com/v1/search?type=artist&limit=10&q=";
spotifyAPI.track = "https://api.spotify.com/v1/search?type=track&limit=10&q=";
spotifyAPI.album = "https://api.spotify.com/v1/search?type=album&limit=10&q=";


function checkToken(){

	// if we've been parsed an access token (the callback from authentication)
	if( window.location.hash.indexOf('access_token=') > -1 || window.location.hash == 'refresh-token' ){
	
		spotifyAPI.token = window.location.hash.substring( window.location.hash.indexOf('access_token=')+13, window.location.hash.indexOf('&') );
		spotifyAPI.token_expiry = new Date().getTime() + 3600000;
		
		localStorage.token = spotifyAPI.token;
		localStorage.token_expiry = spotifyAPI.token_expiry;
		
		window.location.hash = 'explore';
	};
	
	// if we have a token stored locally from a previous session, parse it back to where it belongs
	if( localStorage.token )
		spotifyAPI.token = localStorage.token;
	
	// if we don't have a token (or it has expired), go get one
	if( localStorage.getItem("token") === null || localStorage.token_expiry < new Date().getTime() )
		window.location = 'https://accounts.spotify.com/authorize?client_id='+spotifyAPI.clientid+'&redirect_uri='+spotifyAPI.referrer+'&scope=playlist-modify-private%20playlist-modify-public&response_type=token';
};


function getPlaylists( albumID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbum( albumID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbumsTracks( albumID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'/tracks?market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtistsAlbums( artistID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/albums?market=NZ&album_type=album,single',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtist( artistID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'?market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getTrack( trackID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/tracks/'+trackID+'?market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

// TODO: Add dynamic country code
function getArtistsTopTracks( artistID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/top-tracks?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getRelatedArtists( artistID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/related-artists?limit=10&market=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getFeaturedPlaylists(){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/browse/featured-playlists?market=NZ',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		dataType: "json",
		timeout: 10000
	});
};

function getNewReleases(){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/browse/new-releases?country=NZ',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		dataType: "json",
		timeout: 100000
	});
};

function getPlaylist( userID, playlistID ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+userID+'/playlists/'+playlistID,
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		dataType: "json",
		timeout: 10000
	});
};

function getMyPlaylists(){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists',
		type: "GET",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function createPlaylist( name ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists',
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		data: JSON.stringify( { name: name, public: true } ),
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};

function addTrackToPlaylist( playlistID, trackURI ){
	checkToken();
	return $.ajax({
		url: 'https://api.spotify.com/v1/users/'+spotifyAPI.userID+'/playlists/'+playlistID+'/tracks?uris='+trackURI,
		type: "POST",
		headers: {
			'Authorization': 'Bearer ' + spotifyAPI.token
		},
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});
};




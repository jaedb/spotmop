

// spotify search api
var spotifyAPI = {
	artist: "https://api.spotify.com/v1/search?type=artist&limit=10&q=",
	track: "https://api.spotify.com/v1/search?type=track&limit=10&q=",
	album: "https://api.spotify.com/v1/search?type=album&limit=10&q="
};

function getPlaylists( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbum( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getAlbumsTracks( albumID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/albums/'+albumID+'/tracks?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtistsAlbums( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/albums?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getArtist( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getTrack( trackID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/tracks/'+trackID+'?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

// TODO: Add dynamic country code
function getArtistsTopTracks( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/top-tracks?country=NZ',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};

function getRelatedArtists( artistID ){
	return $.ajax({
		url: 'https://api.spotify.com/v1/artists/'+artistID+'/related-artists?limit=10',
		type: "GET",
		dataType: "json",
		timeout: 5000
	});
};
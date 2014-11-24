/*
 * Spotmop core functionality
 * 
 */

 
 

/* ======================================================== SYSTEM INIT ============ */
/* ================================================================================= */
 
// initiate mopidy
var mopidy = new Mopidy();

// hold core data
var coreArray = new Array();
var consoleError = console.error.bind(console);
var playlists;

 
/* ======================================================== PAGE NAVIGATION ======== */
/* ================================================================================= */

/*
 * Naviate
*/
function navigate(){

    var hash = window.location.hash;
    hash = hash.replace('#','');
    hash = hash.split('/');
    
    var section = hash[0];
    
    navigateToPage(section);
    
    if(section == 'search'){
		startSearch( hash[1] );
    };
    
    if(section == 'explore'){
		explore( hash[1], hash[2] );
    };
    
    // hide playlist 'current' selectors
	$('#menu .playlist-item').removeClass('current');
	$('#playlists .playlist-subpage').addClass('hide');
    
    if(section == 'playlists'){
		$('#playlists .playlist-subpage[data-uri="'+hash[1]+'"]').removeClass('hide');
		$('#menu .playlist-item a[href="#playlists/'+hash[1]+'"]').parent().addClass('current');
    };	
};


/*
 * Navigate the pages
 * Typically triggered by #menu items
 * @var page = string, ID of destination page
*/
function navigateToPage( page ){

	coreArray['currentPage'] == page;
	
	$('.menu-item-wrapper').removeClass('current');
	$('.menu-item-wrapper.'+page).addClass('current');
	
	$('.page').hide();
	$('.page#'+page).show();
	
	coreArray['currentPage'] = page;
	
	if( page == 'queue' )
		updatePlayQueue();
}

/*
 * Explore a page type
 * Typically triggered by clicking any album or artist throughout the system
 * @var page = string, ID of destination subpage
*/
function exploreSubpage( subpage ){
	$('.explore-subpage').hide();
	$('.explore-subpage.'+subpage).show();
}

	
$(document).ready( function(evt){
	
	// navigate to queue to start with
	//navigateToPage('queue');
	
	// listen for click on menu item
	$('.menu-item').on('click', function(evt){
		navigateToPage( $(this).attr('data-target') );
	});
});



/* ======================================================== GLOBAL FUNCTIONALITY === */
/* ================================================================================= */

/*
 * Join artist names
 * Loops an array of artists, and produces a front-end version of strings
*/
function joinArtistNames( artists ){
	
	var jointArtists = '';
	
	for( var i = 0; i < artists.length; i++ ){
	
		var artist = artists[i];
		
		if( jointArtists != '' )
			jointArtists += ', ';
			
		jointArtists += '<span class="clickable" data-uri="'+ artist.uri +'">'+ artist.name +'</span>';
	};
	
	return jointArtists;
};


/*
 * Replace current queue and play selected track
 * @var newTracks is json object of tracks
 * @var trackID is integer of track number we want to play
*/
function replaceAndPlay( tracklistURI, trackID ){
	
	// run a mopidy lookup on the uri (to get compatibile Track objects)
	mopidy.library.lookup(tracklistURI).then(function(result){
		
		// clear current tracklist
		mopidy.tracklist.clear().then(function(){
			
			// add the fetched list of mopidy Track objects
			mopidy.tracklist.add(result).then(function(){
				
				// fetch this list of Track objects
				mopidy.tracklist.getTlTracks().then(function(tracks){
					
					// change play cursor to trackID of the tracklist
					mopidy.playback.changeTrack( tracks[trackID], 1 );
					mopidy.playback.play();
					updatePlayer();
					updatePlayQueue();
				});
			},consoleError);
		});
	},consoleError);
}

/*
 * Build a hash url to inject into the hash location
 * @var uri = spotify uri
*/

function buildHashURL( uri ){
	
	var url = 'explore/';
	
	var uriElements = uri.split(':');
	
	url += uriElements[1] +'/'+ uri;
	
	return url;
};



/* ======================================================== EXPLORE ================ */
/* ================================================================================= */

/*
 * Explore an artist, album or playlist
 * @var uri = spotify uri
*/
function explore( type, uri ){
	
	// get the id (3rd part of the URI)
	var id = uri.split(':')[2];
	
	navigateToPage('explore');
	
	// clear out all the data
	$('#explore .reset-on-load').html('<div class="loader"></div>');
	
	// reveal relevant subpage
	exploreSubpage(type);
		
	// artist view
	if( type == 'artist' ){
		
		getArtist( id ).success(function( artist ){
			renderExploreArtist( artist );
		});
	
	// album view
	}else if( type == 'album' ){
		
		getAlbum( id ).success(function( album ) {
			renderExploreAlbum( album );
		});
	
	// track?
	}else if( type == 'track' ){
	
	// playlist view
	}else if( type == 'playlist' ){
		
	}
	
};

/*
 * Render the Explore Artist panel
*/
function renderExploreArtist( artist ){
	
	// inject artist name
	$('.explore-subpage.artist .name').html( artist.name );
			
	imageURL = '';
	if( artist.images.length > 0 )
		imageURL = artist.images[0].url;
	
	$('.explore-subpage.artist .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
	
	// fetch all of this artist's albums
	getArtistsAlbums( artist.id ).success(function( albums ){
		
		// empty out previous albums
		$('.explore-subpage.artist .albums').html('');
		
		// loop each album
		for(var x = 0; x < albums.items.length; x++){
		
			var album = albums.items[x];
			
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[0].url;
			
			$('.explore-subpage.artist .albums').append( '<div class="album-panel clickable" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></div>' );
		}
	});
	
	// fetch all of this artist's related artists
	getRelatedArtists( artist.id ).success(function( relatedArtists ){
		
		// empty out previous related artists
		$('.explore-subpage.artist .related-artists').html('');
		
		// loop each artist
		for(var x = 0; x < relatedArtists.artists.length; x++){
		
			var relatedArtist = relatedArtists.artists[x];
			
			imageURL = '';
			if( relatedArtist.images.length > 0 )
				imageURL = relatedArtist.images[0].url;
			
			$('.explore-subpage.artist .related-artists').append( '<div class="related-artist-panel clickable" data-uri="'+relatedArtist.uri+'"><span class="thumbnail" style="background-image: url('+imageURL+');"></span><span class="name animate">'+relatedArtist.name+'</span><div class="clear-both"></div></div>' );
		}
	});
	
	// fetch all of this artist's top tracks
	getArtistsTopTracks( artist.id ).success(function( tracks ){
		
		// empty out previous albums
		$('.explore-subpage.artist .tracks').html('');
	
		// save this tracklist in case we want to play one of the track items;
		coreArray['tracklistInFocus'] = tracks.tracks;
		
		// loop each track
		for(var x = 0; x < tracks.tracks.length; x++){
			var track = tracks.tracks[x];
		
			$('.explore-subpage.artist .tracks').append('<div class="track-row row" data-id="'+x+'" data-uri="'+track.uri+'"><span class="icon small"></span><div class="col w30 title">'+track.name+'</div><div class="col w25 artist"><span class="clickable" data-uri="'+track.artists[0].uri+'">'+joinArtistNames(track.artists)+'</span></div><div class="col w30"><span class="clickable" data-uri="'+track.album.uri+'">'+track.album.name+'</span></div><div class="clear-both"></div></div>');
		}
	});
};

/*
 * Render the Explore Album panel
*/
function renderExploreAlbum( album ){
			
	imageURL = '';
	if( album.images.length > 0 )
		imageURL = album.images[0].url;
	
	$('.explore-subpage.album .name').html( album.name );
	$('.explore-subpage.album .artist').html( joinArtistNames(album.artists) );
	
	$('.explore-subpage.album .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
	
	// save this tracklist in case we want to play one of the track items;
	coreArray['tracklistInFocus'] = album.tracks.items;
	
	// empty out previous tracks
	$('.explore-subpage.album .tracks').html('');
	$('.explore-subpage.album .tracks').data('uri', album.uri);
	
	// loop each of the album's tracks
	for(var x = 0; x < album.tracks.items.length; x++){
	
		var track = album.tracks.items[x];
		
		$('.explore-subpage.album .tracks').append('<div class="track-row row" data-id="'+x+'" data-uri="'+track.uri+'"><span class="icon small"></span><div class="col w30 title">'+track.name+'</div><div class="col w30 artist">'+joinArtistNames(track.artists)+'</div><div class="col w30"><span class="clickable" data-uri="'+album.uri+'">'+album.name+'</span></div><div class="clear-both"></div></div>');
	}
};



/* ======================================================== PLAYLIST ACTIONS ======= */
/* ================================================================================= */

function updatePlaylists(){
	
	// Get the users playlists and place them in the client
	mopidy.playlists.getPlaylists().then(function(playlists){
		
		var lists = $('.menu-item-wrapper.playlists .playlist-list');
		var tracks = $('#playlists .playlist-tracks');
		coreArray['playlists'] = playlists;
		
		// clear out the previous playlists
		lists.html('');
		tracks.html('');
		
		// loop each playlist
		for( var i = 0; i < playlists.length; i++ ){
		
			var playlist = playlists[i];
			var tracklist = '';
			
			// add list to the playlists bar
			lists.append('<div class="playlist-item"><a href="#playlists/'+playlist.uri+'">'+playlist.name+'</a></div>');
			
			// loop each playlist's tracks
			for( var t = 0; t < playlist.tracks.length; t++ ){
			
				var track = playlist.tracks[t];
				var albumDetails = '';
				
				if( typeof(track.album) !== 'undefined' )
					albumDetails = '<div class="col w30"><span class="clickable" data-uri="'+track.album.uri+'">'+track.album.name+'</span></div>';
				
				// add list of tracks to playlist page
				tracklist += '<div class="track-row row" data-id="'+t+'" data-uri="'+track.uri+'"><span class="icon small"></span><div class="col w30 title">'+track.name+'</div><div class="col w30 artist">'+joinArtistNames(track.artists)+'</div>'+albumDetails+'<div class="clear-both"></div></div>';
				
			}
			
			// inject tracklist
			tracks.append('<div class="playlist-subpage hide" data-uri="'+playlist.uri+'"><h1 class="bottom-padding">'+playlist.name+'</h1><div class="tracks" data-uri="'+playlist.uri+'">'+tracklist+'</div></div>');
		}
		
	},consoleError);
	
};



/* ======================================================== UPDATE PLAYER ========== */
/* ================================================================================= */

function updatePlayer(){
	mopidy.playback.getCurrentTrack().done(doUpdatePlayer, consoleError);	
	mopidy.playback.getState().done(doUpdateState, consoleError);
	
	if( coreArray['currentPage'] == 'queue' )
		updatePlayQueue();
}

// update artist/track and artwork
var doUpdatePlayer = function(track){
	if (track) {
		
		// parse the track and artist details
		$('#player .artist').html(track.artists[0].name).data('uri', track.artists[0].uri);
		$('#player .track').html(track.name).data('uri', track.uri);
		
		// get the spotify album object and load image
		getAlbum( track.album.uri.replace('spotify:album:','') ).success( function( spotifyAlbum ){
			$('#player .thumbnail').attr('style','background-image: url('+spotifyAlbum.images[2].url+');');
		});
		
		// see if we can find the current track anywhere else in the interface (playlists, explore, etc)
		$(document).find('.track-row').removeClass('current');
		$(document).find('.track-row[data-uri="'+track.uri+'"]').addClass('current');
		
		coreArray['currentTrackURI'] = track.uri;
		
	} else {
		$('#player .artist').html();
		$('#player .track').html();
	}
};

// update player state
var doUpdateState = function(state){
	
	// update player/pause button
	if(state == "playing"){
		$('#player .button[data-action="play-pause"]').children('.icon').removeClass('play').addClass('pause');
		
		// see if we can find the current track anywhere else in the interface (playlists, explore, etc)
		$(document).find('.track-row.current').addClass('playing').removeClass('not-playing');
	}else{
		$('#player .button[data-action="play-pause"]').children('.icon').removeClass('pause').addClass('play');
		
		// see if we can find the current track anywhere else in the interface (playlists, explore, etc)
		$(document).find('.track-row.current').removeClass('playing').addClass('not-playing');
	}
	
	coreArray['state'] = state;
};

// update the current play queue
function updatePlayQueue(){

	mopidy.tracklist.getTracks().then(function( tracks ){
		
		// add the tracks for further use
		coreArray['tracklist'] = tracks;
		
		var $queue = $("#queue .tracks");
		
		// Clear tracklist
		$queue.html('');
		
		// place the track in the list and get the position relative to zero.
		for(var x = 1; x < tracks.length; x++){
		
			var track = tracks[x];
			
			var status = '';
			var albumDetails = '';
			
			// if this track is the currently selected track
			if( typeof(coreArray['currentTrackURI']) !== 'undefined' && track.uri == coreArray['currentTrackURI'] ){
				status = 'not-playing';
				if( coreArray['state'] == 'playing' )
					status = 'playing';
			}
			
			if( typeof(track.album) !== 'undefined' )
				albumDetails = '<div class="col w30"><span class="clickable" data-uri="'+track.album.uri+'">'+track.album.name+'</span></div>';
			
			$queue.append('<div class="track-row row '+status+'" data-id="'+x+'" data-uri="'+track.uri+'"><span class="icon small"></span><div class="col w30 title">'+track.name+'</div><div class="col w30 artist">'+joinArtistNames(track.artists)+'</div>'+albumDetails+'<div class="clear-both"></div></div>');
		}
		
		// highlight the current track
		$queue.find('.track-row').removeClass('current');
		$queue.find('.track-row[data-uri="'+coreArray['currentTrackURI']+'"]').addClass('current');
		
	},consoleError);
}




/* ====================================================== SEARCH =================== */
/* ================================================================================= */

/*
 * Run a search for all content that matches a supplied term
 * @var query = string of search query
*/
function startSearch( query ){
	
	// reveal search results menu item
	$('.search-results-menu-item').show();
	
	// empty out previous result containers
	$('.search-results-section .results').html('');
	
	// Search tracks
	$.ajax({
		url: spotifyAPI.track+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('track',result.tracks);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
	// Search albums
	$.ajax({
		url: spotifyAPI.album+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('album',result.albums);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
	// Search artists
	$.ajax({
		url: spotifyAPI.artist+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('artist',result.artists);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
};


/*
 * Add search results to the interface
 * Injects into #search page
*/
function addSearchResults(type, results){
	
	var counter = 0;
	
	for(var i = 0;i < results.items.length; i++){
	
		var result = results.items[i];
		var imageURL = '';
		
		if( type == 'artist' ){
			
			if( result.images.length > 0 )
				imageURL = result.images[0].url;
			
			$('#search-results .search-results-section.'+ type +' .results').append( '<div class="artist-panel clickable" data-uri="'+result.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+result.name+'</span></div>' );
		
		}else if( type == 'album' ){
			
			if( result.images.length > 0 )
				imageURL = result.images[0].url;
			
			$('#search-results .search-results-section.'+ type +' .results').append( '<div class="album-panel clickable" data-uri="'+result.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+result.name+'</span></div>' );
		
		}else if( type == 'track' ){
		
			$('#search-results .search-results-section.'+ type +' .results').append( '<div class="track-row row" data-uri="'+result.uri+'"><div class="name col w30">'+result.name+'</div><div class="name col w30">'+joinArtistNames(result.artists)+'</div><div class="name col w30"><span class="clickable" data-uri="'+ result.album.uri +'">'+result.album.name+'</span></div><div class="clear-both"></div></div>' );
		
		};
	};
	
};




/* ====================================================== ON CONNECTION TO MOPIDY == */
/* ================================================================================= */

mopidy.on("state:online", function(){
	
	updatePlayer();
	updatePlaylists();
	
	if( window.location.hash )
		navigate();

	// On track resumed (gets the TL track)
	mopidy.on("event:trackPlaybackResumed" ,function(track){
		updatePlayer();
	});
	
	// On start of a new track (gets the TL track)
	mopidy.on("event:trackPlaybackStarted" ,function(track){
		updatePlayer();
	});
	
	// Volume changed
	mopidy.on("event:volumeChanged" ,function(vol){
		updatePlayer();
	});
	
	// Store the state on a playback state change
	mopidy.on("event:playbackStateChanged", function(obj){
		updatePlayer();
	});
	
	// explore
	$(document).on('click', '.clickable', function(evt){
		if( typeof( $(this).attr('data-uri') ) === 'undefined' )
			return false;
		
		window.location.hash = buildHashURL($(this).data('uri'));
	});
	
	// search submit <enter>
	$('.search-field input').keyup(function(evt){
		if( $(this).val() != '' && evt.keyCode == 13 )
			window.location.hash = 'search/'+$(this).val();
	});
	
	// search submit click
	$('.search-field .submit').on('click', function(evt){
		if( $(this).siblings('input').val() != '' )
			window.location.hash = 'search/'+$(this).siblings('input').val();
	});
	
	// listen to hash changes (drives all functionality!)
	$(window).on('hashchange',function(){
	    navigate();
	});
	
	// click to select a track
	$(document).on('click', '.track-row', function(evt){
		$(this).siblings().removeClass('highlighted');
		$(this).addClass('highlighted');
	});
	
	// double-click to play track from queue
	$(document).on('dblclick', '#queue .track-row', function(evt){
		
		var trackID = $(this).data('id');
		
		mopidy.tracklist.getTlTracks().then(function( tracks ){
			mopidy.playback.changeTrack( tracks[trackID], 1 );
			mopidy.playback.play();
			updatePlayer();
		},consoleError);
	});
	
	// double-click to play track from album list (explore/search result)
	$(document).on('dblclick', '#explore .explore-subpage.album .track-row', function(evt){	
		var trackID = $(this).data('id');		
		var tracklistURI = $('#explore .explore-subpage.album .tracks').data('uri');
		replaceAndPlay( tracklistURI, trackID );
	});
	
	// double-click to play track from playlist list 
	$(document).on('dblclick', '#playlists .tracks .track-row', function(evt){	
		var trackID = $(this).data('id');		
		var tracklistURI = $(this).closest('.tracks').data('uri');
		replaceAndPlay( tracklistURI, trackID );
	});
	
	$('#player .button[data-action="previous-track"]').on('click', function(evt){
		mopidy.playback.previous();
		updatePlayer();
	});
	
	$('#player .button[data-action="next-track"]').on('click', function(evt){
		mopidy.playback.next();
		updatePlayer();
	});
	
	$('#player .button[data-action="play-pause"]').on('click', function(evt){
		if(coreArray['state'] == "playing"){
			mopidy.playback.pause();
		}else if(coreArray['state'] == "stopped"){
			mopidy.playback.play();
		}else{
			mopidy.playback.resume();
		}
			
		updatePlayer();
	});
	
});



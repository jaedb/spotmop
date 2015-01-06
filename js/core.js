/*
 * Spotmop core functionality
 * 
 */

 


/*
 * Get an item's ID out of a provided URI
 * Returns string
*/
function getIdFromUri( uri ){
	
	// get the id (3rd part of the URI)
	if( typeof uri === 'undefined' )
		return false;
	
	var uriArray = uri.split(':');
	
	// see if we're a playlist URI
	if( typeof uriArray[3] !== 'undefined' && uriArray[3] == 'playlist' )
		return uriArray[4];
	
	var id = uriArray[2];
	return id;
};


 

/* ======================================================== SYSTEM INIT ============ */
/* ================================================================================= */
 

// initiate mopidy
var mopidy = new Mopidy({
	webSocketUrl: mopidyWS
});

// hold core data
var coreArray = new Array();
var consoleError = function(){ $('.loader').fadeOut(); console.error.bind(console); };
var playlists;

	

// once the document is prepped and good to go
$(document).ready( function(evt){
    
    checkToken();
    navigate();

    // kick off standard events
    mopidy.on("event:trackPlaybackResumed" ,function(track){	updatePlayer(); console.log('resumed'); });
    mopidy.on("event:trackPlaybackStarted" ,function(track){	updatePlayer(); console.log('started'); });
    mopidy.on("event:trackPlaybackEnded" ,function(track){	    updatePlayer(); console.log('ended'); });
    mopidy.on("event:volumeChanged" ,function(vol){				updateVolume(); });
    mopidy.on("event:playbackStateChanged", function(obj){		updatePlayer(); console.log('playback changed'); });

	
	
    
	// --- PLAYER SEEK EVENTS --- //
   
    $('.progress .slider').slider({
            range: "min",
            min: 1,
            from: 0,
            to: 100,
            slide: function(event, ui){
		
                // prevent undefined errors
                if( typeof(coreArray['currentTrack']) !== 'undefined'){
                    mopidy.playback.seek( coreArray['currentTrack'].length * ui.value / 100 ).then( function(result){
                        updatePlayPosition();
                    });
                };
            }
        });
	
    
	// --- PLAYER VOLUME EVENTS --- //
   
    $('.volume .slider').slider({
            range: "min",
            min: 1,
            from: 0,
            to: 100,
            slide: function(event, ui){
                mopidy.playback.setVolume( ui.value ).then( function(result){
                    updateVolume();
                },consoleError);
            }
        });
	
	
	
	// --- REMOVING TRACKS --- //
	
	$(document).on('keydown', function(evt){
	
		if( evt.keyCode == 8 && !$('input').is(':focus') ){
		
			// disarm the key functionality in any case, for UX consistency
			evt.preventDefault();
			
            // --- removing from queue --- //
            
			if( coreArray['currentPage'] == 'queue' ){
				
				var uris = [];
				var trackDOMs = $('#queue').find('.track-row.highlighted');

				// loop each track, and remove it from the tracklist / play queue
				trackDOMs.each( function(index, value){
					uris.push( $(value).data('uri') );
				});
				
				// remove all the tracks from the list
				mopidy.tracklist.remove({uri: uris}).then( function(result){
					updatePlayQueue();
					trackDOMs.each( function(index,value){ $(value).remove(); } );
				},consoleError);

			}
			
            // --- removing from playlist --- //
			
			if( coreArray['currentPage'] == 'playlist' ){
				
				$('.loader').show();
				
				var uris = [];
				var trackDOMs = $('#playlist').find('.track-row.highlighted');
                var playlistID = $('#playlist').data('uri');
				
				// loop each track, and remove it from the tracklist / play queue
				trackDOMs.each( function(index, value){
					uris.push( {'uri' : $(value).data('uri')} );
				});
                
                // hide them from DOM to enhance UX 'snappiness'
                trackDOMs.addClass('hide');
                
				// now actually remove all the tracks from the list
				removeTracksFromPlaylist(playlistID, uris).success( function(result){
					$('.loader').fadeOut();
					trackDOMs.remove();
				}).fail( function( response ){
					$('.loader').fadeOut();
					trackDOMs.removeClass('hide');
					notifyUser('error', 'Error removing track: '+response.responseJSON.error.message );
				});

			}
		}
	});
	
	
	
	// --- ADDING TRACKS TO QUEUE --- //
			
	$(document).find('#menu .menu-item-wrapper.queue').droppable({
		drop: function(evt, ui){
			addTrackToQueue( $(ui.helper).data('uri') );
		}
	});
	
	
	
	// --- TRACK SELECTION EVENTS --- //
	
	// click to select a track
	$(document).on('click', '.track-row.track-item', function(evt){
		$(this).siblings().removeClass('highlighted');
		$(this).addClass('highlighted');
	});
	
	// double-click to play track from queue
	$(document).on('doubletap', '#queue .track-row.track-item', function(evt){
		
		var trackID = $(this).data('id');
		
		// immediately update dom, for 'snappy' ux
		$('#queue .track-item').removeClass('current').removeClass('playing');
		$(this).addClass('current').addClass('playing');
		
		// now actually change what's playing
		mopidy.tracklist.getTlTracks().then(function( tracks ){
			mopidy.playback.changeTrack( tracks[trackID], 1 );
			mopidy.playback.play();
			updatePlayer();
		},consoleError);
	});
	
	// double-click to play track from album list (explore/search result)
	$(document).on('doubletap', '#album .track-row.track-item', function(evt){	
		var trackID = $(this).data('id');		
		var tracklistURI = $('#album .tracks').data('uri');
		replaceAndPlay( tracklistURI, trackID );
	});
	
	// double-click to play track from playlist list 
	$(document).on('doubletap', '#playlist .track-row.track-item', function(evt){
	
		$('.loader').show();
		
		// immediately update dom, for 'snappy' ux
		$('#queue .track-item').removeClass('current').removeClass('playing');
		$(this).addClass('current').addClass('playing');
		
		// now actually do it
		var trackID = $(this).data('id');
		var tracklistURI = $(this).closest('.tracks').data('uri');
		replaceAndPlay( tracklistURI, trackID );
	});
	
	// double-click to play track from a top-tracks list
	// TODO: This runs slow because we have to do individual track URI lookups and add them one-by-one
	$(document).on('doubletap', '.tracks.use-tracklist-in-focus .track-row.track-item', function(evt){	
	
		$('.loader').show();
		
		var trackID = $(this).data('id');
		
		var trackURIs = [];
		
		$(this).parent().children('.track-row:not(.headings)').each( function(key,value){
			trackURIs.push( $(value).data('uri') );
		});
		
		replaceAndPlayTracks( trackURIs, trackID );
	});
	
	
    
	// --- PLAYER CONTROLS EVENTS --- //
	
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


    // --- CONNECTION TO MOPIDY --- ///
    
    mopidy.on("state:online", function(){

        notifyUser('notify','Connection established to Mopidy');

        // set play queue as consuming (once played, remove the track)
        mopidy.tracklist.consume = true;

        coreArray['browsePageLoaded'] = false;

        updatePlayer();
        updateVolume();
        updatePlaylists();
    });
	
	/*
    // On reconnecting
    mopidy.on("reconnecting", function(){
        notifyUser('notify',"Reconnecting to server");
    });

    // On state offline
    mopidy.on("state:offline", function(){
        notifyUser('bad',"No connection to the sever");
    });
	*/
	
	// Check the current time position of a track every second
	setInterval(function(){
		mopidy.playback.getTimePosition().then( function( position ) {
			coreArray['currentTrackPosition'] = position;
			updatePlayPosition();
			highlightPlayingTrack();
		}, consoleError);
	},1000);
                   
});






/* ======================================================== GLOBAL FUNCTIONALITY === */
/* ================================================================================= */



/*
 * Render track list table
 * @var container = element to inject tracks into
 * @var tracks = array of Tracks objects
 * @var tracklist = TrackList array
*/
function renderTracksTable( container, tracks, tracklistUri, album ){
	
	var html = '';
	html += '<div class="track-row row headings">';
		html += '<div class="col w5"></div>';
		html += '<div class="col w25">Track</div>';
		html += '<div class="col w30">Artist</div>';
		html += '<div class="col w30">Album</div>';
		html += '<div class="clear-both"></div>';
	html += '</div>';
	
	if( typeof(tracks) === 'undefined' || tracks == null || tracks.length <= 0 ){
		html += '<div class="track-row no-tracks">No tracks</div>';
	}else{
	
		// loop each of the album's tracks
		for(var x = 0; x < tracks.length; x++){
			
			if( tracks[x].track )
				var track = tracks[x].track;
			else
				var track = tracks[x];
			
			html += '<div class="track-row row track-item" data-id="'+x+'" data-uri="'+track.uri+'">';
				html += '<div class="col w5 icon-container"><i class="fa fa-circle"></i><i class="fa fa-play"></i></div>';
                html += '<div class="col w25 title">'+track.name+'</div>';
				html += '<div class="col w30 artist">'+joinArtistNames(track.artists)+'</div>';
				if( album )
					html += '<div class="col w30"><a href="#album/'+album.uri+'" data-uri="'+album.uri+'">'+album.name+'</a></div>';
				else if ( track.album )
					html += '<div class="col w30"><a href="#album/'+track.album.uri+'" data-uri="'+track.album.uri+'">'+track.album.name+'</a></div>';
				html += '<div class="clear-both"></div>';
			html += '</div>';
		}
	}
	
	container.html( html );
	
	if( tracklistUri !== 'undefined' )
		container.data('uri', tracklistUri);
	
	// draggable to drop them onto playlists
	container.find('.track-row.track-item').draggable({
        distance: 30,
		revert: true,
		revertDuration: 0,
		helper: 'clone',
		appendTo: 'body',
  		zIndex: 10000
	});
	
	return true;
};


/*
 * Join artist names
 * Loops an array of artists, and produces a front-end version of strings
*/
function joinArtistNames( artists, make_links ){
	
    if( typeof(make_links) === 'undefined' )
        var make_links = true;
    
	var jointArtists = '';
	
	if( typeof(artists) !== 'undefined' ){
	
		for( var i = 0; i < artists.length; i++ ){
		
			var artist = artists[i];
			
			if( jointArtists != '' )
				jointArtists += ', ';
				
            if( make_links )
                jointArtists += '<a href="#artist/'+ artist.uri +'" data-uri="'+ artist.uri +'">'+ artist.name +'</a>';
            else
                jointArtists += artist.name;
		};
	}
	
	return jointArtists;
};


/*
 * Replace current queue and play selected track
 * @var newTracks is json object of tracks
 * @var trackID is integer of track number we want to play
*/
function replaceAndPlay( tracklistURI, trackID ){
	console.log('replace and play tracklisturi '+ tracklistURI);
	// run a mopidy lookup on the uri (to get compatibile Track objects)
	mopidy.library.lookup(tracklistURI).then(function(result){
		
		console.log('looked up');
		// clear current tracklist
		mopidy.tracklist.clear().then(function(){
			
			// add the fetched list of mopidy Track objects
			mopidy.tracklist.add(result).then(function(){
				console.log('added');
                
                // play the track chris!
				playTrackByID( trackID );
				$('.loader').fadeOut();
			},consoleError);
		});
	},consoleError);
}


/*
 * Replace current queue and play selected track
 * @var trackURIs = array of track URIs
 * @var trackID is integer of track number we want to play
*/
function replaceAndPlayTracks( trackURIs, trackID ){
	
	// clear current tracklist
	mopidy.tracklist.clear().then(function(){
		
		// loop all the URIs
		for( var i = 0; i < trackURIs.length; i++ ){
			
			// add each track to the tracklist
			mopidy.tracklist.add(null, i, trackURIs[i]).then( function(response){
				//console.log( response );
			});
			
			// if we're the track we want to play
			if( i == trackID ){
                playTrackByID( trackID );
				$('.loader').fadeOut();
			}
			
		};
	});
}


/*
 * Play a track from the current tracklist, by ID
 * Requires tracks to be queued, and an ID to be provided
 * @var trackID = integer, 0-based index of tracklist
*/

function playTrackByID( trackID ){

    // fetch this list of Track objects from the source
    mopidy.tracklist.getTlTracks().then(function( tracks ){
		
        // change play cursor to trackID of the tracklist
        mopidy.playback.changeTrack( tracks[trackID], 1 ).then( function(evt){
			
            mopidy.playback.play();
            
        });
        
        updatePlayer();
        
    },consoleError); 
};

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


/*
 * Notify the user of an event
 * @var type = message type (notice|warning)
 * @var message = message string
*/

function notifyUser( type, message, persistent ){
	
	// set default values
	persistent = typeof persistent !== 'undefined' ? persistent : false;
	
	var notification = $('#notification');
	
	notification.find('.message').html( message );
	notification.removeClass('error').removeClass('notice').removeClass('warning').addClass(type);
	notification.slideDown('fast');
	
	if( !persistent )
		notification.delay(3000).fadeOut('slow');
	
}

function closeNotification(){
	var notification = $('#notification');
	notification.find('.message').html( '' );
	notification.hide();
}


/*
 * Add a track (by URI) to the play queue
 * @var uri = trackURI
*/
function addTrackToQueue( uri ){
	mopidy.tracklist.add(null, null, uri).then( function(result){
		updatePlayQueue();
		notifyUser('notify','Track(s) added to queue');
	});
};




/* ======================================================== UPDATE PLAYER ========== */
/* ================================================================================= */

function updatePlayer(){
	mopidy.playback.getState().done(doUpdateState, consoleError);
	mopidy.playback.getCurrentTrack().done(doUpdatePlayer, consoleError);	
	updatePlayPosition();
}

// update artist/track and artwork
var doUpdatePlayer = function(track){
    
	if( track ){
		
		// check if the current track is different from what we're already showing
		if( ( typeof coreArray['currentTrack'] === 'undefined' ) || ( track.uri != coreArray['currentTrack'].uri ) ){
			
			// parse the track and artist details
			$('#player .artist').html( joinArtistNames(track.artists) );
			$('#player .track').html(track.name).data('uri', track.uri);
			
			// get the spotify album object and load image
			if( typeof( track.album ) !== 'undefined' ){
				getAlbum( getIdFromUri( track.album.uri ) ).success( function( spotifyAlbum ){
					$('#player').attr('style','background-image: url('+spotifyAlbum.images[0].url+');');
					$('#player .thumbnail').attr('href','#explore/album/'+ track.album.uri );
				});
			};
			
			coreArray['currentTrack'] = track;
		}
		
	}else{
		$('#player .artist').html();
		$('#player .track').html();
	}
    
	updateWindowTitle();
	highlightPlayingTrack();
};

// update player state
var doUpdateState = function(state){
	
	// update player/pause button
	if(state == "playing"){
		$('#player .button[data-action="play-pause"]').children('.fa').removeClass('fa-play').addClass('fa-pause');
	}else{
		$('#player .button[data-action="play-pause"]').children('.fa').removeClass('fa-pause').addClass('fa-play');
	}
	
	coreArray['state'] = state;
	highlightPlayingTrack();
};

// update play position bar
function updatePlayPosition(){
	
	// prevent undefined errors
	if( typeof(coreArray['currentTrack']) !== 'undefined'){
	
		// figure out the percentage through the track, and apply to progress
		var percent = ( coreArray['currentTrackPosition'] / coreArray['currentTrack'].length ) * 100;
		$('#player .progress .ui-slider-range').css('width',percent+'%');
		$('#player .progress .ui-slider-handle').css('left',percent+'%');
	}
	
}

// update volume, and update interface accordingly
function updateVolume(){
    
    mopidy.playback.getVolume().then( function(volume){
		$('#player .volume .ui-slider-range').css('width',volume+'%');
		$('#player .volume .ui-slider-handle').css('left',volume+'%');
    },consoleError);
    
}

// update the title in the window tab
function updateWindowTitle(){
    
    var documentIcon = '\u25FC ';
    
	if( typeof( coreArray['currentTrack'] ) !== 'undefined' ){
    
        var track = coreArray['currentTrack'];
        
        // inject icon
        if( coreArray['state'] == 'playing' )
            documentIcon = '\u25B6 ';

        // update window title
        document.title = documentIcon + track.name +' - '+ joinArtistNames(track.artists,false);

    }else{
        document.title = documentIcon + 'No track playing';
    }
    
}


// update player state
function highlightPlayingTrack(){
	
	// reset all tracks
	$(document).find('.track-row').removeClass('current').removeClass('playing').removeClass('not-playing');
	
	// make sure we are playing first
	if( typeof( coreArray['currentTrack'] ) !== 'undefined' ){
		
		// find current track
		var currentTrack = $(document).find('.track-row[data-uri="'+coreArray['currentTrack'].uri+'"]');
		currentTrack.addClass('current');
		
		// make the current track playing/not playing
		if(coreArray['state'] == "playing"){
			currentTrack.addClass('playing').removeClass('not-playing');
		}else{
			currentTrack.removeClass('playing').addClass('not-playing');
		}
	
	};
};

// update the current play queue
function updatePlayQueue(){
	
	if( typeof( mopidy.tracklist ) === 'undefined' ){
        renderTracksTable( $("#queue .tracks"), null, null );
		return false;
	}
	
    mopidy.tracklist.getTracks().then(function( tracks ){
		
        // add the tracks for further use
        coreArray['tracklist'] = tracks;

        var $queue = $("#queue .tracks");

        // Clear tracklist
        $queue.html('');

        renderTracksTable( $("#queue .tracks"), tracks, null );

        // draggable queue tracks
        $("#queue .tracks").sortable({
            items: '.track-row:not(.headings)',
            axis: 'y',
            stop: function(evt, ui){
                var newPosition = ui.item.index() - 1;

                // move this item on the playlist, to the new position
                mopidy.tracklist.move( $(ui.item).data('id'), $(ui.item).data('id')+1, newPosition );
            }
        });

    },consoleError);
}




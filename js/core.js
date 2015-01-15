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


/* currently not in need */

window.addEventListener("storage", storageUpdated, false);

function storageUpdated(storage){
	console.log('localStorage contents has been changed');
	navigate();
	updatePlaylists();
}

/* end */
 

/* ======================================================== SYSTEM INIT ============ */
/* ================================================================================= */
 

// hold core data
var coreArray = new Array();
var consoleError = function(){ $('.loader').fadeOut(); console.error.bind(console); };
var playlists;
var chainedEventsCount = 0;
var mopidy;


/*
 * Once the document is ready and all base DOM is prepped
 * Kickstart the engine
*/
$(document).ready( function(evt){
	
	// set defaults for mopidy api
    if( !localStorage.settings_hostname )
		localStorage.settings_hostname = 'localhost';	
    if( !localStorage.settings_port )
		localStorage.settings_port = '6680';	
    if( !localStorage.settings_country )
		localStorage.settings_country = 'NZ';	
    if( !localStorage.settings_locale )
		localStorage.settings_locale = 'en_NZ';	
    if( !localStorage.settings_clientid )
		localStorage.settings_clientid = 'a87fb4dbed30475b8cec38523dff53e2';

    checkToken();
    initiateMopidy();
	navigate();
});


/*
 * Initiate a mopidy connection
*/
function initiateMopidy(){
	
	var everySecond;		
	var websocketURL = "ws://"+ localStorage.settings_hostname +":"+ localStorage.settings_port +"/mopidy/ws";
	
	mopidy = new Mopidy({
		webSocketUrl: websocketURL
	});
	
    mopidy.on("event:trackPlaybackResumed" ,function(track){	updatePlayer(); });
    mopidy.on("event:trackPlaybackStarted" ,function(track){	updatePlayer(); });
    mopidy.on("event:trackPlaybackEnded" ,function(track){	    updatePlayer(); });
    mopidy.on("event:volumeChanged" ,function(vol){				updateVolume(); });
    mopidy.on("event:playbackStateChanged", function(obj){		updatePlayer(); });	
    
    mopidy.on("state:online", function(){
	
        // set play queue as consuming (once played, remove the track)
        mopidy.tracklist.consume = true;
		coreArray['mopidyOnline'] = true;
		
		$(document).find('.mopidy.connection-status').removeClass('offline').addClass('online');
		
        updatePlayer();
        updateVolume();
        updatePlaylists();
        updatePlayQueue();
	
		// Check the current time position of a track every second
		everySecond = setInterval(function(){
			mopidy.playback.getTimePosition().then( function( position ) {
				coreArray['currentTrackPosition'] = position;
				updatePlayPosition();
				highlightPlayingTrack();
			}, consoleError);
		},1000);
    
		setupInteractivity();
        
    });

    // On state offline
    mopidy.on("state:offline", function(){
		$(document).find('.mopidy.connection-status').removeClass('online').addClass('offline');
		clearInterval( everySecond );
		coreArray['mopidyOnline'] = false;
    });
	
}






/* ================================================================ USER INTERACTIVITY ============ */
/* ================================================================================================ */

function setupInteractivity(){
	
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
		
		// spacebar
		if( evt.keyCode == 32 && !$('input').is(':focus') ){
		
			// disarm the key functionality in any case, for UX consistency
			evt.preventDefault();
			
			if(coreArray['state'] == "playing"){
				mopidy.playback.pause();
			}else if(coreArray['state'] == "stopped"){
				mopidy.playback.play();
			}else{
				mopidy.playback.resume();
			}
			
			updatePlayer();
		}
		
		// delete
		if( evt.keyCode == 46 && !$('input').is(':focus') ){
		
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
				
				updateLoader('start');
				
				var uris = [];
				var trackDOMs = $('#playlist').find('.track-row.highlighted');
                var playlistID = $('#playlist .tracks').data('id');
				
				// loop each track, and remove it from the tracklist / play queue
				trackDOMs.each( function(index, value){
					uris.push( {'uri' : $(value).data('uri')} );
				});
                
                // hide them from DOM to enhance UX 'snappiness'
                trackDOMs.addClass('hide');
                
				// now actually remove all the tracks from the list
				removeTracksFromPlaylist(playlistID, uris).success( function(result){
					updateLoader('stop');
					trackDOMs.remove();
				}).fail( function( response ){
					updateLoader('stop');
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
		
	var shiftKeyHeld = false;
	var ctrlKeyHeld = false;
	$('body').bind('keydown',function(evt){
		if (evt.which === 16) {
			shiftKeyHeld = true;
		}else if (evt.which === 17) {
			ctrlKeyHeld = true;
		}
	}).bind('keyup',function(){
	      shiftKeyHeld = false;
	      ctrlKeyHeld = false;
	});
	
	// click to select a track
	$(document).on('click', '.track-row.track-item', function(evt){
		
		if( shiftKeyHeld ){
			
			var otherSelection = $(this).siblings('.highlighted').first();
			
			if( otherSelection.index() < $(this).index() )
				otherSelection.nextUntil($(this)).add($(this)).addClass('highlighted');
			else
				$(this).nextUntil(otherSelection).add($(this)).addClass('highlighted');
			
		}else if( ctrlKeyHeld ){
			$(this).addClass('highlighted');
			
		}else{
			$(this).siblings().removeClass('highlighted');
			$(this).addClass('highlighted');
		}
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
	
	// double-click to play track from a top-tracks list
	// TODO: This runs slow because we have to do individual track URI lookups and add them one-by-one
	$(document).on('doubletap', '#artist .tracks .track-row.track-item', function(evt){	
		
		$('.loader').show();
		
		// immediately update dom, for 'snappy' ux
		$(this).siblings().removeClass('current').removeClass('playing');
		$(this).addClass('current').addClass('playing');
		
		var track_to_play = $(this);
		var tracks_following = $(this).nextAll();
		
		// empty the list
		mopidy.tracklist.clear().then( function(response){;
			
			// add the track we need to play first
			mopidy.tracklist.add( null, track_to_play.index(), track_to_play.attr('data-uri') ).then(function(response){
				
				mopidy.playback.changeTrack(response[0],1);
				mopidy.playback.play();
				updatePlayer();
				
				// currently only works for single-artist tracks
				var artist = track_to_play.attr('data-artists');
				var trackname = track_to_play.attr('data-name');
				
				// add this track to our taste profile
				updateTasteProfile( track_to_play.attr('data-uri'), track_to_play.attr('data-name'), artist )
					.success( function(response){
						console.log(response);
					})
					.fail( function(response){
						console.log(response);
					});
			
				// now add all the other tracks ... (yes, one by one)
				tracks_following.each( function(index, value){
					chainedEventsCount++;
					mopidy.tracklist.add( null, null, $(value).data('uri') ).then( function(response){
						chainedEventsCount--;
						if( chainedEventsCount == 0)
							$('.loader').fadeOut();
					},consoleError);
				});
			},consoleError);
		},consoleError);
	});
	
	
	
	// double-click to play track from a top-tracks list
	// TODO: This runs slow because we have to do individual track URI lookups and add them one-by-one
	$(document).on('doubletap', '#playlist .tracks .track-row.track-item', function(evt){	
		
		$('.loader').show();
		
		// immediately update dom, for 'snappy' ux
		$(this).siblings().removeClass('current').removeClass('playing');
		$(this).addClass('current').addClass('playing');
		
		var track_to_play_uri = $(this).attr('data-uri');
		var tracklist_uri = $(this).closest('.tracks').attr('data-uri');
		
		// empty the list
		mopidy.tracklist.clear().then( function(response){
			
			// run a lookup on this playlist
			mopidy.library.lookup(tracklist_uri).then(function(tracks){
				
				// add all the tracks to the queue
				mopidy.tracklist.add( tracks ).then(function(response){
					
					$('.loader').fadeOut();
					
					// loop the tracks returned (Tl_Track object)
					for(var i = 0; i < response.length; i++){
						
						// if this track uri matches the one we clicked on, then play it chris!
						if( response[i].track.uri == track_to_play_uri ){
							mopidy.playback.changeTrack(response[i],1);
							mopidy.playback.play();
							updatePlayer();
						}
					}
				},consoleError);
			},consoleError);
		},consoleError);
		
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
};










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
	
	if( typeof(tracks) === 'undefined' || tracks == null || tracks.length <= 0 ){
		html += '<div class="track-row no-tracks">No tracks</div>';
	}else{
	
		// loop each of the album's tracks
		for(var x = 0; x < tracks.length; x++){
			
			if( tracks[x].track )
				var track = tracks[x].track;
			else
				var track = tracks[x];
			
			var artistArray = [];
			for(var a = 0; a < track.artists.length; a++){
				artistArray.push( track.artists[a].name );
			}
			
			html += '<div class="track-row row track-item" data-id="'+x+'" data-uri="'+track.uri+'" data-name="'+track.name+'" data-artists="'+artistArray+'">';
				html += '<div class="col w5 icon-container"><i class="fa fa-circle"></i><i class="fa fa-play"></i><i class="fa fa-refresh  fa-spin"></i></div>';
                html += '<div class="col w25 title">'+track.name+'</div>';
				html += '<div class="col w30 artist">'+joinArtistNames(track.artists)+'</div>';
				html += '<div class="col w25">';
				if( album )
					html += '<a href="#album/'+album.uri+'" data-uri="'+album.uri+'">'+album.name+'</a>';
				else if ( track.album )
					html += '<a href="#album/'+track.album.uri+'" data-uri="'+track.album.uri+'">'+track.album.name+'</a>';
				html += '</div>';
				html += '<div class="col w10 duration">'+millisecondsToMinutes(track.duration_ms)+'</div>';
				html += '<div class="col w5 popularity"><div class="percentage"><div class="bar" style="width: '+track.popularity+'%;"></div></div></div>';
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
	
	highlightPlayingTrack();
	
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
 * Convert milliseonds to minutes
 * @var ms = integer
 * Returns minutes in format H:m:s
*/
function millisecondsToMinutes( ms ){
	if( ms == null )
		return '00:00';
	var minutes = Math.floor(ms / 60000);
	var seconds = ((ms % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}



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
	notification.removeClass('error').removeClass('notice').removeClass('warning').removeClass('good').addClass(type);
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
 * Update loader
 * Check if we have no more things loading, then hide the loader
 * @var event = start/stop 
*/
function updateLoader( event ){
	
	if( typeof(event) === null )
		event = 'start';
	
	if( event == 'start' )
		chainedEventsCount++;
	else if( event == 'stop' )
		chainedEventsCount--;
	
	if( chainedEventsCount <= 0){
		$('.loader').fadeOut();	
		chainedEventsCount = 0;
	}else{
		$('.loader').show();
	}
	
	updateInterface();
}


/*
 * Update dom objects' appearance (ie square panels, responsive layout
 *
*/
function updateInterface(){
	
	// make album and playlist panels square
	$(document).find('.album-panel, .artist-panel').each( function(index, value){
		$(value).css('height', $(value).outerWidth() +'px');
	});
}


/*
 * Add a track (by URI) to the play queue
 * @var uri = trackURI
*/
function addTrackToQueue( uri ){
	mopidy.tracklist.add(null, null, uri).then( function(result){
		updatePlayQueue();
		updateLoader();
	});
};




/* ======================================================== UPDATE PLAYER ========== */
/* ================================================================================= */

function updatePlayer(){
	if( typeof(mopidy.playback) !== 'undefined' ){
		mopidy.playback.getState().done(doUpdateState, consoleError);
		mopidy.playback.getCurrentTrack().done(doUpdatePlayer, consoleError);	
		updatePlayPosition();
	}
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
	
	updateLoader('start');
	
	if( typeof( mopidy.tracklist ) === 'undefined' ){
        renderTracksTable( $("#queue .tracks"), null, null );
		updateLoader('stop');
		return false;
	}
	
    mopidy.tracklist.getTracks().then(function( tracks ){
    	
		updateLoader('stop');
		
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

		updateLoader();

    },consoleError);
}




/**
 * Create a Player service
 *
 * This holds all of the calls for the player interface and data
 **/
 
angular.module('spotmop.services.player', [])

.factory("PlayerService", ['$rootScope', '$interval', '$http', '$filter', 'SettingsService', 'MopidyService', 'SpotifyService', 'NotifyService',  'PusherService', 'LastfmService', function( $rootScope, $interval, $http, $filter, SettingsService, MopidyService, SpotifyService, NotifyService, PusherService, LastfmService ){
	
	// setup initial states
	var state = {
		playbackState: 'stopped',
        radio: {
			enabled: false
		},
		isPlaying: function(){ return state.playbackState == 'playing' },
		isRepeat: false,
		isRandom: false,
		isMute: false,
		isConsume: false,
		volume: 100,
		playPosition: 0,
		currentTracklist: [],
		getCurrentTracklist: function(){ return state.currentTracklist; },
		currentTlTrack: false,
		currentTracklistPosition: function(){
			if( state.currentTlTrack ){
				
				var currentTrackObject = $filter('filter')(state.currentTracklist, {tlid: state.currentTlTrack.tlid});
				var at_position = 0;
				
				// make sure we got the track as a TlTrack object (damn picky Mopidy API!!)
				if( currentTrackObject.length > 0 ){
					at_position = state.currentTracklist.indexOf( currentTrackObject[0] ) + 1;
				}
				
				return at_position;
			}else{
				return null;
			}
		},
		playPositionPercent: function(){
			if( state.currentTlTrack ){
				return ( state.playPosition / state.currentTlTrack.track.length * 100 ).toFixed(2);
			}else{
				return 0;
			}
		}
	}
	
	// when mopidy connection detected, fetch real states
	$rootScope.$on('mopidy:state:online', function(){
		updateToggles();
		
		updateCurrentTrack();
		updatePlayerState();
		updateVolume();
		updateTracklist();
		
		// figure out if we're playing already
		MopidyService.getState().then( function( newState ){
			state.playbackState = newState;
		});
	});
	
	$rootScope.$on('mopidy:event:tracklistChanged', function(event, options){
        updateTracklist();
	});
	
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		updateToggles();
	});
	
	$rootScope.$on('mopidy:event:playbackStateChanged', function( event, state ){
		updatePlayerState( state.new_state );
	});
	
	$rootScope.$on('mopidy:event:seeked', function( event, position ){
		setPlayPosition( position.time_position );
	});
	
	$rootScope.$on('mopidy:event:volumeChanged', function( event, volume ){
		if( volume.volume != state.volume )
			updateVolume( volume.volume );
	});
	
	$rootScope.$on('spotmop:pusher:online', function( event, message ){
		PusherService.query({ action: 'get_radio' })
            .then( function(response){
                state.radio = response.data.radio;
            });
	});
	
	$rootScope.$on('spotmop:pusher:radio_started', function( event, message ){
		state.radio = message.data.radio;
	});
	
	$rootScope.$on('spotmop:pusher:radio_stopped', function( event, message ){
		state.radio = message.data.radio;
	});
	
	// update our toggle states from the mopidy server
	function updateToggles(){	
        MopidyService.getRepeat().then( function(isRepeat){
            state.isRepeat = isRepeat;
        });
        MopidyService.getRandom().then( function(isRandom){
            state.isRandom = isRandom;
        });
        MopidyService.getMute().then( function(isMute){
            state.isMute = isMute;
        });
		MopidyService.getConsume().then( function( isConsume ){
			state.isConsume = isConsume;
		});
	}
	
	// listen for current track changes
	$rootScope.$on('mopidy:event:trackPlaybackStarted', function( event, tlTrack ){
		
		// only if our new tlTrack differs from our current one
		if( typeof(state.currentTlTrack.track) === 'undefined' || state.currentTlTrack.track.uri != tlTrack.tl_track.track.uri ){
			state.currentTlTrack = tlTrack.tl_track;
			updateCurrentTrack( tlTrack.tl_track );
			updatePlayerState();
			setPlayPosition(0);
		}
	});
	
	
	/**
	 * Set the new play position and, if required, figure it out first
	 * @param newPosition = integer (optional)
	 **/
	function setPlayPosition( newPosition ){
	
		// if we haven't been provided with a specific new position
		if( typeof( newPosition ) === 'undefined' ){
		
			// go get the time position (provided Mopidy is online)
			if( $rootScope.mopidyOnline ){
				MopidyService.getTimePosition().then( function(position){
					state.playPosition = position;
				});
			}
		
		// we've been parsed the time position, so just use that
		}else{
			state.playPosition = newPosition;
		}
	}
	
	$interval( 
		function(){		
			if(
				state.isPlaying() && 
				typeof(state.currentTlTrack) !== 'undefined' && 
				typeof(state.currentTlTrack.track) !== 'undefined' ){					
					if( ( state.playPosition + 1000 ) < state.currentTlTrack.track.length ){
						setPlayPosition( state.playPosition + 1000 );
					}else{
						setPlayPosition( 0 );
					}
			}
		},
		1000
	);
	
	
	/**
	 * Update the state of the player
	 * @param newState = string (optional)
	 **/
	function updatePlayerState( newState ){
		
		// if we've been told what the new state is, let's just use that
		if( typeof( newState ) !== 'undefined' ){
			state.playbackState = newState;		
			updateWindowTitle();
			setPlayPosition();
				
		// not sure of new state, so let's find out first
		}else{
			MopidyService.getState().then( function( newState ){
				state.playbackState = newState;
				updateWindowTitle();
				setPlayPosition();
			});
		}	
	};
	
	
	/**
	 * Update the current track
	 * This updates all instances of the track with new artwork, seek bar, window title, etc.
	 * @param tlTrack = the new track object (optional)
	 **/
	function updateCurrentTrack( tlTrack ){
		
		// update all ui uses of the track (window title, player bar, etc)
		var setCurrentTrack = function( tlTrack ){
			
			// save the current tltrack for global usage
			state.currentTlTrack = tlTrack;
			
			// if we have an album image baked-in, let's use that
			if( typeof(tlTrack.track.album.images) !== 'undefined' && tlTrack.track.album.images.length > 0 ){
				
				// convert our singular image into the expected mopidy image model
				var images = [{ __model__: 'Image', uri: tlTrack.track.album.images }];
				
				// plug it in
				state.currentTlTrack.track.images = $filter('sizedImages')( images );
				$rootScope.$broadcast('spotmop:currenttrack:loaded', state.currentTlTrack);
			
			// no image provided by backend, so let's fetch it from elsewhere
			}else{
			
				// if this is a Spotify track, get the track image from Spotify
				if( tlTrack.track.uri.substring(0,8) == 'spotify:' ){
					// now we have track info, let's get the spotify artwork	
					SpotifyService.getTrack( tlTrack.track.uri )
						.then(function( response ){
							if( typeof(response.album) !== 'undefined' ){
								state.currentTlTrack.track.images = $filter('sizedImages')(response.album.images);
							}
							$rootScope.$broadcast('spotmop:currenttrack:loaded', state.currentTlTrack);
						});
				
				// not a Spotify track (ie Mopidy-Local), so let's use LastFM to get some artwork
				}else{
					
					var artist = encodeURIComponent( tlTrack.track.artists[0].name );
					var album = encodeURIComponent( tlTrack.track.album.name );
					
					if( artist && album )
						LastfmService.albumInfo( artist, album )
							.then( function(response){
								
									// remove the existing image
									state.currentTlTrack.track.image = false;
									
									// if we got an album match, plug in the 'extralarge' image to our state()
									if( typeof(response.album) !== 'undefined' ){
										state.currentTlTrack.track.images = $filter('sizedImages')(response.album.image);
									}
									
									$rootScope.$broadcast('spotmop:currenttrack:loaded', state.currentTlTrack);
								});
				}
			}
			
			// update ui
			//setPlayPosition();
			updateWindowTitle();
		}
		
		// track provided, update pronto garcong!
		if( typeof( tlTrack ) !== 'undefined' ){
			setCurrentTrack( tlTrack );
			
		// no track provided, so go fetch it first, then proceed
		}else{
			
			MopidyService.getCurrentTlTrack().then( function( tlTrack ){
				if(tlTrack !== null && tlTrack !== undefined){
					if(tlTrack.track.name.indexOf("[loading]") > -1){
						MopidyService.lookup(tlTrack.track.uri).then(function(result){
							setCurrentTrack(result[0]);
						});
					}else{
						setCurrentTrack(tlTrack);
					}
				}
			});
		}
	};	
    
    /**
     * Fetch our tracklist from Mopidy, and update our record of it
     **/
    function updateTracklist(){
		MopidyService.getCurrentTlTracks().then( function( tlTracks ){
            
            // loop all the tlTracks and flatten them to a consistent format
            var tracks = [];            
            for( var i = 0; i < tlTracks.length; i++ ){
                var track = tlTracks[i].track;
                track.type = 'tltrack';
                track.tlid = tlTracks[i].tlid;
                tracks.push( track );
            }
            state.currentTracklist = tracks;
			
			// no tracks? make sure we don't have anything 'playing'
			// this would typically be called when we clear our tracklist, or have got to the end
			if( !tlTracks || tlTracks.length <= 0 ){
				state.currentTlTrack = false;
				updateWindowTitle();
			}
		});
    }
		

	/**
	 * Update browser title
	 **/
	function updateWindowTitle(){
	
		var track = state.currentTlTrack.track;
        var newTitle = 'No track playing';
		
        if( track ){
            var documentIcon = '\u25A0 ';
            var artistString = '';
            
            if( track.artists ){
                for( var i = 0; i < track.artists.length; i++ ){
                    if( artistString != '' )
                        artistString += ', ';
                    artistString += track.artists[i].name;
                };
            }

            if( state.isPlaying() ) documentIcon = '\u25B6 ';

            newTitle = documentIcon +' '+ track.name +' - '+ artistString;        
        };
        
		document.title = newTitle;
	}
	
	
	/**
	 * Update volume
	 * Fetches (if required) the volume from mopidy and sets to state
	 * @param volume = int (optional)
	 **/
	function updateVolume( newVolume ){
	
		// if we've been told what the new volume is, let's just use that
		if( typeof( newVolume ) !== 'undefined' ){
			state.volume = newVolume;
			
		// not told what new vol is, so let's fetch and set
		}else{
			MopidyService.getVolume().then(function( volume ){
				state.volume = volume;
			});
		}
	}
	
	
	
    
	/**
	 * Shortcut keys
	 **/
	$rootScope.$on('spotmop:keyboardShortcut:space', function( event ){
		if( state.isPlaying() ) var icon = 'pause'; else var icon = 'play';
		service.playPause();
		NotifyService.shortcut( icon );
    });
	$rootScope.$on('spotmop:keyboardShortcut:right', function( event ){		
		if( $rootScope.ctrlKeyHeld ){
			service.next();
			NotifyService.shortcut( 'forward' );
		}
    });
	$rootScope.$on('spotmop:keyboardShortcut:left', function( event ){    
		if( $rootScope.ctrlKeyHeld ){
			service.previous();
			NotifyService.shortcut( 'backward' );
		}
    });
	$rootScope.$on('spotmop:keyboardShortcut:up', function( event ){
		if( $rootScope.ctrlKeyHeld ){
			state.volume += 10;
			
			// don't let the volume exceed maximum possible, 100%
			if( state.volume >= 100 )
				state.volume = 100;
			service.setVolume( state.volume );
			NotifyService.shortcut( 'volume-up' );
		}
    });
	$rootScope.$on('spotmop:keyboardShortcut:down', function( event ){
		if( $rootScope.ctrlKeyHeld ){
			state.volume -= 10;
			
			// don't let the volume below minimum possible, 0%
			if( state.volume < 0 )
				state.volume = 0;
			service.setVolume( state.volume );
			NotifyService.shortcut( 'volume-down' );
		}
    });	
	
	
	/**
	 * Setup response object
	 * This is the object that is available to all controllers
	 **/
	var service = {
		
		state: function(){
			return state;
		},
		
		playPause: function(){
			if( state.isPlaying() ){
				MopidyService.pause();
			}else{
				MopidyService.play();
			}
		},
		
		stop: function(){
			MopidyService.stopPlayback();
		},
		
		next: function(){
			MopidyService.next();
		},
		
		previous: function(){
			MopidyService.previous();
		},
		
		seek: function( time ){
			state.playPosition = time;
			MopidyService.seek( time );
		},
		
		setVolume: function( percent ){
			state.volume = percent;
			MopidyService.setVolume( percent );
		},
        
        /**
         * Radio functionality
         * TODO: Move this into a dedicated service
         **/
        startRadio: function(uris){
            
            var data = {
				action: 'start_radio',
                seed_artists: [],
                seed_genres: [],
                seed_tracks: []
            }
            
            for( var i = 0; i < uris.length; i++){
                switch( SpotifyService.uriType( uris[i] ) ){
                    case 'artist':
                        data.seed_artists.push( uris[i] );
                        break;
                    case 'track':
                        data.seed_tracks.push( uris[i] );
                        break;
                }
            }
            
			PusherService.query( data )
                .then( function(response){
                    state.radio = response.data.radio;
                });
        },
        
        stopRadio: function(){
			PusherService.query({ action: 'stop_radio' })
                .then( function(response){
                    state.radio = response.data.radio;
                });
        },
		
		/**
		 * Playback behavior toggles
		 **/		
		toggleRepeat: function(){
			if( state.isRepeat )
				MopidyService.setRepeat( false ).then( function(response){ state.isRepeat = false; } );
			else
				MopidyService.setRepeat( true ).then( function(response){ state.isRepeat = true; } );
			console.log( state );
		},		
		toggleRandom: function(){
			if( state.isRandom )
				MopidyService.setRandom( false ).then( function(response){ state.isRandom = false; } );
			else
				MopidyService.setRandom( true ).then( function(response){ state.isRandom = true; } );
		},		
		toggleMute: function(){
			if( state.isMute )
				MopidyService.setMute( false ).then( function(response){ state.isMute = false; } );
			else
				MopidyService.setMute( true ).then( function(response){ state.isMute = true; } );
		},
		toggleConsume: function(){
			if( state.isConsume )
				MopidyService.setConsume( false ).then( function(response){ state.isConsume = false; } );
			else
				MopidyService.setConsume( true ).then( function(response){ state.isConsume = true; } );
		}
		
	};
	 
	return service;
	
}]);






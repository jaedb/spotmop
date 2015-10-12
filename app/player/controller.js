'use strict';

angular.module('spotmop.player', [
	'spotmop.services.player',
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $rootScope, $timeout, $interval, $element, PlayerService, MopidyService, SpotifyService, EchonestService, SettingsService ){
	
	$scope.state = PlayerService.state;
	    
	
	/**
	 * Core player controls
	 **/
	
	$scope.playPause = function(){
		PlayerService.playPause();
	}
    $scope.stop = function(){
		PlayerService.stop();
    },
	$scope.next = function(){
		PlayerService.next();
	}
	$scope.previous = function(){
		PlayerService.previous();
	}
	$scope.seek = function( event ){
		var slider, offset, position, percent, seekTime;
		if( $(event.target).hasClass('slider') )
			slider = $(event.target);
		else
			slider = $(event.target).closest('.slider');
		
		// calculate the actual destination seek time
		offset = slider.offset();
		position = event.pageX - offset.left;
		percent = position / slider.innerWidth();
		seekTime = Math.round(percent * $scope.currentTlTrack.track.length);
		
		// tell mopidy to make it so
		MopidyService.seek( seekTime );
	}	
	$scope.setVolume = function( event ){
		var slider, offset, position, percent;
		if( $(event.target).hasClass('slider') )
			slider = $(event.target);
		else
			slider = $(event.target).closest('.slider');
		
		// calculate the actual destination seek time
		offset = slider.offset();
		position = event.pageX - offset.left;
		percent = position / slider.innerWidth() * 100;
		percent = parseInt(percent);
		
		PlayerService.setVolume( percent );
	};
	
	
	/**
	 * Play order toggle switches
	 **/
	
    $scope.toggleRepeat = function(){
		PlayerService.toggleRepeat();
    };
    $scope.toggleRandom = function(){
		PlayerService.toggleRandom();
    };
    $scope.toggleMute = function(){
		PlayerService.toggleMute();
    };
	
    
	/**
	 * Shortcut keys
	 **/
	$scope.$on('spotmop:keyboardShortcut:space', function( event ){        
		$scope.playPause();
    });
	$scope.$on('spotmop:keyboardShortcut:right', function( event ){		
		if( $rootScope.ctrlKeyHeld )
			$scope.next();
    });
	$scope.$on('spotmop:keyboardShortcut:left', function( event ){    
		if( $rootScope.ctrlKeyHeld )    
			$scope.previous();
    });
	$scope.$on('spotmop:keyboardShortcut:up', function( event ){
		if( $rootScope.ctrlKeyHeld ){
			$scope.volume += 10;
			
			// don't let the volume exceed maximum possible, 100%
			if( $scope.volume >= 100 )
				$scope.volume = 100;
			MopidyService.setVolume( $scope.volume );
		}
    });
	$scope.$on('spotmop:keyboardShortcut:down', function( event ){
		if( $rootScope.ctrlKeyHeld ){
			$scope.volume -= 10;
			
			// don't let the volume below minimum possible, 0%
			if( $scope.volume < 0 )
				$scope.volume = 0;
			MopidyService.setVolume( $scope.volume );
		}
    });	
	
	
	/** 
	 * When all systems are go
	 **/
	
	$scope.$on('mopidy:state:online', function(){
		updateCurrentTrack();
		updatePlayerState();
		updateVolume();
        MopidyService.getRepeat().then( function(isRepeat){
            $scope.isRepeat = isRepeat;
        });
        MopidyService.getRandom().then( function(isRandom){
            $scope.isRandom = isRandom;
        });
        MopidyService.getMute().then( function(isMute){
            $scope.isMute = isMute;
        });
	});
	
	$scope.$on('mopidy:event:playbackStateChanged', function( event, state ){
		updatePlayerState( state.new_state );
	});
	
	$scope.$on('mopidy:event:seeked', function( event, position ){
		updatePlayPosition( position.time_position );
	});
	
	$scope.$on('mopidy:event:volumeChanged', function( event, state ){
		updateVolume();
	});
	
	$scope.$on('mopidy:event:tracklistChanged', function( event ){
		MopidyService.getCurrentTlTracks().then( function(tlTracks){
			$scope.$parent.currentTracklist = tlTracks;
		});
	});
	
	// listen for current track changes
	// TODO: Move this into the MopidyService for sanity
	$scope.$on('mopidy:event:trackPlaybackStarted', function( event, tlTrack ){
		$scope.$parent.currentTlTrack = tlTrack.tl_track;
		updateCurrentTrack( tlTrack.tl_track );
		updatePlayerState();
		
		// log this play
		if( SettingsService.getSetting('echonestenabled',false) )
			EchonestService.addToTasteProfile( 'play', tlTrack.tl_track.track.uri );
	});
	
	
	/**
	 * Update play progress position slider
	 **/
	$interval( 
		function(){
			if( $scope.playing ){
				$scope.playPosition += 1000;
			}
		},
		1000
	);
	
	/**
	 * Set the new play position and, if required, figure it out first
	 * @param newPosition = integer (optional)
	 **/
	function updatePlayPosition( newPosition ){
	
		// if we haven't been provided with a specific new position
		if( typeof( newPosition ) === 'undefined' ){
		
			// go get the time position
			MopidyService.getTimePosition().then( function(position){
				$scope.playPosition = position;
			});
		
		// we've been parsed the time position, so just use that
		}else{
			$scope.playPosition = newPosition;
		}
	}
	
	
	/**
	 * Update the state of the player
	 * @param new state (optional)
	 **/
	function updatePlayerState( newState ){
		
		// if we've been told what the new state is, let's just use that
		if( typeof( newState ) !== 'undefined' ){
			if( newState == 'playing' )
				$scope.playing = true;
			else
				$scope.playing = false;
			
			updateWindowTitle();
				
		// not sure of new state, so let's find out first
		}else{
			MopidyService.getState().then( function( newState ){
				if( newState == 'playing' )
					$scope.playing = true;
				else
					$scope.playing = false;
				
				updateWindowTitle();
			});
		}
		
		updatePlayPosition();		
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
			$scope.$parent.currentTlTrack = tlTrack;
			
			// now we have track info, let's get the spotify artwork	
			SpotifyService.getTrack( tlTrack.track.uri )
				.success(function( response ) {
					$scope.$parent.currentTlTrack.track.album.images = response.album.images;
				})
				.error(function( error ){
					$scope.status = 'Unable to load new releases';
				});
			
			// update ui
			updatePlayPosition();
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
	 * Update volume
	 * Fetches the volume from mopidy and sets to $scope
	 **/
	function updateVolume(){
	
		MopidyService.getVolume().then(function( volume ){
			$scope.volume = volume;
		});
	}
	
	/*
	
	// listen for tracklist changes, and then rewrite the broadcast to include the tracks themselves
	// TODO: Move this into the MopidyService for sanity
	$scope.$on('mopidy:event:tracklistChanged', function( newTracklist ){
		MopidyService.getCurrentTrackListTracks()
			.then(
				function( tracklist ){
					$rootScope.$broadcast('spotmop:tracklistUpdated', tracklist);
				}
			);
	});
	*/
		

	/**
	 * Update browser title
	 **/
	function updateWindowTitle(){
	
		var track = $scope.currentTlTrack.track;
        var newTitle = 'No track playing';
		
        if( track ){
            var documentIcon = '\u25A0 ';
            var artistString = '';
            
            $.each(track.artists, function(key,value){
                if( artistString != '' )
                    artistString += ', ';
                artistString += value.name;
            });

            if( $scope.playing )
                documentIcon = '\u25B6 ';

            newTitle = documentIcon +' '+ track.name +' - '+ artistString;        
        };
        
		document.title = newTitle;
	}
	
});
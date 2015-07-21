'use strict';

angular.module('spotmop.player', [
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $rootScope, $timeout, $interval, MopidyService, SpotifyService ){
	
	// setup template containers
	$scope.muted = false;
	$scope.playing = false;
	$scope.isRepeat = false;
	$scope.isRandom = false;
	$scope.isMute = false;
	$scope.volume = 100;
	$scope.playPosition = 0;
	$scope.playPositionPercent = function(){
		if( typeof($scope.currentTlTrack.track) !== 'undefined' )
			return ( $scope.playPosition / $scope.currentTlTrack.track.length * 100 ).toFixed(2);
	};
    
	
	/**
	 * Core player controls
	 **/
	
	$scope.playPause = function(){
        if( $scope.playing )
            MopidyService.pause();
        else
            MopidyService.play();
	}
    $scope.stop = function(){
        MopidyService.stopPlayback();
    },
	$scope.next = function(){
		MopidyService.next();
	}
	$scope.previous = function(){
		MopidyService.previous();
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
		console.log( 'Seeking to '+percent+'% and '+seekTime+'ms' );
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
		
		$scope.volume = percent;
		MopidyService.setVolume( percent );
	};
	
	
	/**
	 * Play order toggle switches
	 **/
	
    $scope.toggleRepeat = function(){
        if( $scope.isRepeat )
            MopidyService.setRepeat( false ).then( function(response){ $scope.isRepeat = false; } );
        else
            MopidyService.setRepeat( true ).then( function(response){ $scope.isRepeat = true; } );
    };
    $scope.toggleRandom = function(){
        if( $scope.isRandom )
            MopidyService.setRandom( false ).then( function(response){ $scope.isRandom = false; } );
        else
            MopidyService.setRandom( true ).then( function(response){ $scope.isRandom = true; } );
    };
    $scope.toggleMute = function(){
        if( $scope.isMute )
            MopidyService.setMute( false ).then( function(response){ $scope.isMute = false; } );
        else
            MopidyService.setMute( true ).then( function(response){ $scope.isMute = true; } );
    };
	
	// listen for changes from other clients
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		MopidyService.getRandom().then( function( isRandom ){
			$scope.isRandom = isRandom;
		});
		MopidyService.getMute().then( function( isMute ){
			$scope.isMute = isMute;
		});
	});
	
    
	/**
	 * When the space key is broadcast, play/pause
	 **/
	$scope.$on('spotmop:keyboardShortcut:space', function( event ){        
		$scope.playPause();
    });
	
	
	/**
	 * Fullscreen player panel
	 **/
	
	$scope.fullscreenPlayerExpanded = false;
	
	// when we trigger a expand/collapse event
	$scope.toggleFullscreenPlayer = function(){
		
		var player = $(document).find('#player');
		
		// collapse
		if( $scope.fullscreenPlayerExpanded ){
			
			// specify the height of the collapsed player
			var collapsedHeightForAnimation = '90px';				
			if( $scope.mediumScreen() )
				collapsedHeightForAnimation = '56px';
			
			// animate the transition
			player.animate(
				{
					height: collapsedHeightForAnimation
				},
				300,
				function(){
					// remove the hardcoded height we used for animation
					// this ensures we can change our window dimensions and css responsive layouts will work without a refresh
					player.removeAttr('style');
				}
			);
			player.find('.fullscreen-player').fadeOut('fast');
			player.find('.slim-player').fadeIn('fast');
			
			$scope.fullscreenPlayerExpanded = false;
		
		// expand
		}else{
			player.animate(
				{
					height: $(document).height()
				},
				200,
				function(){
					// now we've animated, let's set it to full-height (also helps with window resizing when expanded)
					player.css('height','100%');
				}
			);
			player.find('.fullscreen-player').fadeIn();
			player.find('.slim-player').fadeOut('fast');
			
			$scope.fullscreenPlayerExpanded = true;
		}
	};
	
	
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
	
	$scope.$on('mopidy:event:seeked', function( event, state ){
		updatePlayPosition();
	});
	
	$scope.$on('mopidy:event:volumeChanged', function( event, state ){
		updateVolume();
	});
	
	$scope.$on('mopidy:event:tracklistChanged', function(){
		MopidyService.getCurrentTlTracks().then( function(tlTracks){
			$scope.$parent.currentTracklist = tlTracks;
			updateCurrentTrack();	// TODO: Investigate if there's a more efficient way to do this
		});
	});
	
	// listen for current track changes
	// TODO: Move this into the MopidyService for sanity
	$scope.$on('mopidy:event:trackPlaybackStarted', function( event, tlTrack ){
		$scope.$parent.currentTlTrack = tlTrack.tl_track;
		updateCurrentTrack( tlTrack.tl_track );
		updatePlayerState();
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
	
	function updatePlayPosition(){
		MopidyService.getTimePosition().then( function(position){
			$scope.playPosition = position;
		});
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
		
			// save for any other use we might dream up
			$scope.$parent.currentTlTrack = tlTrack;
			
			// mark this track as playing in the currentTracklist
			angular.forEach( $scope.$parent.currentTracklist, function( currentTracklistTrack ){
				if( currentTracklistTrack.tlid === tlTrack.tlid )
					currentTracklistTrack.playing = true;
				else
					currentTracklistTrack.playing = false;
			});
			
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
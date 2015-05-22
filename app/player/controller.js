'use strict';

angular.module('spotmop.player', [
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $timeout, $interval, MopidyService, SpotifyService ){
	
	// setup template containers
	$scope.currentTrack = {};
	$scope.muted = false;
	$scope.playing = false;
	$scope.volume = 100;
	$scope.playPosition = 0;
	$scope.playPositionPercent = function(){
		if( typeof($scope.currentTrack.length) !== 'undefined' )
			return ( $scope.playPosition / $scope.currentTrack.length * 100 ).toFixed(2);
	};
	
	// core controls
	$scope.playPause = function(){
	if( $scope.playing )
		MopidyService.pause();
	else
		MopidyService.play();
	}
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
		seekTime = Math.round(percent * $scope.currentTrack.length);
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
	
	$scope.$on('mopidy:state:online', function(){
		updateCurrentTrack();
		updatePlayerState();
		updateVolume();
	});
	
	$scope.$on('mopidy:event:trackPlaybackStarted', function(){
		updateCurrentTrack();
		updatePlayerState();
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
				
		// not sure of new state, so let's find out first
		}else{
			MopidyService.getState().then( function( newState ){
				if( newState == 'playing' )
					$scope.playing = true;
				else
					$scope.playing = false;
			});
		}
		
		updatePlayPosition();
	};
	
	/**
	 * Get current track
	 * We've been told the current track has changed, so now let's get it
	 **/
	function updateCurrentTrack(){
		MopidyService.getCurrentTrack().then(function(track){
			if(track !== null && track !== undefined){
				if(track.name.indexOf("[loading]") > -1){
					MopidyService.lookup(track.uri).then(function(result){
						updatePlayerTrack(result[0]);
					});
				}else{
					updatePlayerTrack(track);
				}
			}
		});
	};
	
	/**
	 * Update the player with new track object.
	 * Loads graphic, length, title, etc into template vars
	 * @param track Track object
	 **/
	function updatePlayerTrack( track ){
	
		$scope.currentTrack = track;
		
		// now we have track info, let's get the spotify artwork	
		SpotifyService.getTrack( track.uri )
			.success(function( response ) {
				$scope.currentTrack.album.images = response.album.images;
			})
			.error(function( error ){
				$scope.status = 'Unable to load new releases';
			});
		
		updatePlayPosition();
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
	
});
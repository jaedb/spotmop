'use strict';

angular.module('spotmop.player', [
	'spotmop.services.player',
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $rootScope, $timeout, $interval, $element, PlayerService, MopidyService, SpotifyService, SettingsService ){
	
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
		var slider, offset, position, percent, time;
		if( $(event.target).hasClass('slider') )
			slider = $(event.target);
		else
			slider = $(event.target).closest('.slider');
		
		// calculate the actual destination seek time
		offset = slider.offset();
		position = event.pageX - offset.left;
		percent = position / slider.innerWidth();
		time = Math.round(percent * $scope.state().currentTlTrack.track.length);
		
		PlayerService.seek( time );
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
    $scope.toggleConsume = function(){
		PlayerService.toggleConsume();
    };
	
    
	/**
	 * Shortcut keys
	 **/
	
	$scope.$on('mopidy:event:tracklistChanged', function( event ){
		MopidyService.getCurrentTlTracks().then( function(tlTracks){
			$scope.$parent.currentTracklist = tlTracks;
		});
	});
	
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
	
});
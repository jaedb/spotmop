'use strict';

angular.module('spotmop.player', [
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $timeout, MopidyService, SpotifyService ){
	
	$scope.currentTrack = {};
	$scope.muted = false;
	$scope.playing = false;
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
	
	// let's kickstart this beast
	// we use $timeout to delay start until $digest is completed
	$timeout(
		function(){ MopidyService.start(); },0
	);
	
	$scope.$on('mopidy:state:online', function(){
		updateCurrentTrack();
		updatePlayerState();
	});
	
	$scope.$on('mopidy:event:trackPlaybackStarted', function(){
		updateCurrentTrack();
		updatePlayerState();
	});
	
	$scope.$on('mopidy:event:playbackStateChanged', function( event, state ){
		updatePlayerState( state.new_state );
	});
	
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
	};
	
});
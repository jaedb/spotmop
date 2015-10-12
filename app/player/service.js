/**
 * Create a Player service
 *
 * This holds all of the calls for the player interface and data
 **/
 
angular.module('spotmop.services.player', [])

.factory("PlayerService", ['$rootScope', 'MopidyService', 'SettingsService', 'EchonestService', function( $rootScope, MopidyService, SettingsService, EchonestService ){
	
	// setup initial states
	var state = {
		playing: false,
		isRepeat: false,
		isRandom: false,
		isMute: false,
		volume: 100,
		playPosition: 0,
		currentTlTrack: null,
		playPositionPercent: 50 // <<< TODO
		/*function(){
			if( typeof($scope.currentTlTrack.track) !== 'undefined' )
				return ( $scope.playPosition / $scope.currentTlTrack.track.length * 100 ).toFixed(2);
		}*/
	}
	
	// listen for changes from other clients
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		MopidyService.getRandom().then( function( isRandom ){
			state.isRandom = isRandom;
		});
		MopidyService.getMute().then( function( isMute ){
			state.isMute = isMute;
		});
		MopidyService.getRepeat().then( function( isRepeat ){
			state.isRepeat = isRepeat;
		});
	});
	
	
	// setup response object
	return {
		
		state: function(){
			return state;
		},
		
		playPause: function(){
			if( state.playing ){
				MopidyService.pause();
				state.playing = false;
			}else{
				MopidyService.play();
				state.playing = true;
			}
		},
		
		stop: function(){
			MopidyService.stopPlayback();
			state.playing = false;
		},
		
		next: function(){
		
			// log this skip (we do this BEFORE moving to the next, as the skip is on the OLD track)
			if( SettingsService.getSetting('echonestenabled',false) )
				EchonestService.addToTasteProfile( 'skip', state.currentTlTrack.track.uri );
		
			MopidyService.play();
			MopidyService.next();
		},
		
		previous: function(){
			MopidyService.previous();
		},
		
		setVolume: function( percent ){
			state.volume = percent;
			MopidyService.setVolume( percent );
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
		}
		
	};
	
}]);






'use strict';

angular.module('spotmop.browse.tracklist', [
	'spotmop.services.mopidy',
	'ngRoute'
])

.controller('TracklistController', function TracklistController( $scope, $rootScope, MopidyService ){

	// setup switches to detect shift/control key holds
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
	
	// when we SINGLE click on a track
	$scope.trackClicked = function( event ){
		
		// get the track row (even if we clicked a child element)
		var target = $(event.target);
		if( !target.hasClass('track') )
			target = target.closest('.track');
		
		// control click
		if( ctrlKeyHeld ){
			target.addClass('selected');		

		// shift click
		}else if( shiftKeyHeld ){
		
			// figure out the first in the list of highlighted
			var otherSelection = target.siblings('.selected').first();
			
			// then highlight either all up or all below the other selection
			if( otherSelection.index() < target.index() )
				otherSelection.nextUntil(target).add(target).addClass('selected');
			else
				target.nextUntil(otherSelection).add(target).addClass('selected');
		}else{
			// unhighlight all siblings
			target.siblings('.track').removeClass('selected');
			target.addClass('selected');		
		}
	}
	
	// when we DOUBLE click on a track
	$scope.trackDoubleClicked = function( event ){
		
		console.log('double clicked');
		
		// get the track row (even if we clicked a child element)
		var target = $(event.target);
		if( !target.hasClass('track') )
			target = target.closest('.track');
		
		var trackToPlayIndex = target.index();
		var surroundingTracks = target.parent().children('.track');
		var newTracklistUris = [];
		
		$.each( surroundingTracks, function(key,value){
			newTracklistUris.push( $(value).attr('data-uri') );
		});
		
		MopidyService.playTrack( newTracklistUris, trackToPlayIndex );
	}
});
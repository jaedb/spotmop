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
			target.addClass('highlighted');		

		// shift click
		}else if( shiftKeyHeld ){
		
			// figure out the first in the list of highlighted
			var otherSelection = target.siblings('.highlighted').first();
			
			// then highlight either all up or all below the other selection
			if( otherSelection.index() < target.index() )
				otherSelection.nextUntil(target).add(target).addClass('highlighted');
			else
				target.nextUntil(otherSelection).add(target).addClass('highlighted');
		}else{
			// unhighlight all siblings
			target.siblings('.track').removeClass('highlighted');
			target.addClass('highlighted');		
		}
	}
	
	// when we DOUBLE click on a track
	$scope.trackDoubleClicked = function( event ){
		
		// get the track row (even if we clicked a child element)
		var target = $(event.target);
		if( !target.hasClass('track') )
			target = target.closest('.track');
		
		/*
		MopidyService.addToTracklist({ uris: [target.attr('data-uri')] }).then(function(response){
			// Broadcast event
			console.log( response );
			$rootScope.$broadcast("mopidy:event:tracklistChanged", {});
		});
		*/

		MopidyService.playTrack( "spotify:track:0zU2NTeAeyzTX53RwiTWN5" )
			.then( function(response){
				console.log( response );
			});
			
		console.log('double click');
	}
	
});
'use strict';

angular.module('spotmop.browse.tracklist', [
	'spotmop.services.mopidy'
])


.directive('track', function() {
	return {
		restrict: 'E',
		scope: {
			track: '='
		},
		templateUrl: '/app/browse/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope ){
			
			// when we SINGLE click on a track (only within this scope)
			$element.click( function(evt){

				// get the track row (even if we clicked a child element)
				var target = $(evt.target);
				if( !target.hasClass('track') )
					target = target.closest('.track');

				// control click
				if( $rootScope.ctrlKeyHeld ){
					target.toggleClass('selected');

				// shift click
				}else if( $rootScope.shiftKeyHeld ){

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
			});
	
			// when we DOUBLE click on a track (only within this scope)
			$element.dblclick( function(evt){

				// get the track row (even if we clicked a child element)
				var target = $(evt.target);
				if( !target.hasClass('track') )
					target = target.closest('.track');

				// play from queue
				if( target.closest('.tracklist').hasClass('queue-items') ){

					// get the queue
					MopidyService.getCurrentTlTracks().then( function( tracklist ){

						var tlTrack;

						// find our double-clicked track in the tracklist
						$.each( tracklist, function(key, track){

							if( track.tlid == target.attr('data-tlid') ){

								// then play our track
								return MopidyService.playTlTrack({ tl_track: track });
							}	
						});
					});

				// play from anywhere else
				}else{
					var trackToPlayIndex = target.index();
					var followingTracks = target.nextAll();
					var newTracklistUris = [];

					$.each( followingTracks, function(key,value){
						if( $(value).attr('data-uri') )
							newTracklistUris.push( $(value).attr('data-uri') );
					});

					// play the target track pronto
					MopidyService.playTrack( [target.attr('data-uri')], 0 ).then( function(){

						// notify user that this could take some time
						$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'playing-from-tracklist', message: 'Adding tracks... this may take some time'});

						// add the following tracks to the tracklist
						MopidyService.addToTrackList( newTracklistUris ).then( function(response){
							$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'playing-from-tracklist'});
						});
					});

				}   
			});
		}
	}
})


.directive('tltrack', function() {
	return {
		restrict: 'E',
		scope: {
			track: '='
		},
		templateUrl: '/app/browse/tracklist/tltrack.template.html',
		link: function( $scope, element, attrs ){
			
			// when track changed, let's comapre this track.tlid with the new playing track tlid
			// TODO: Figure out how to trigger this on load of the queue (because it currently loads without running this)
			$scope.$on('spotmop:currentTrackChanged', function( event, tlTrack ){
				if( tlTrack.tlid === $scope.track.tlid ){
					$scope.track.trackCurrentlyPlaying = true;
				}else{
					$scope.track.trackCurrentlyPlaying = false;
				}
			});
		},
		controller: function( $element, $scope, $rootScope ){
			
			// when we SINGLE click on a track (only within this scope)
			$element.click( function(evt){

				// get the track row (even if we clicked a child element)
				var target = $(evt.target);
				if( !target.hasClass('track') )
					target = target.closest('.track');

				// control click
				if( $rootScope.ctrlKeyHeld ){
					target.toggleClass('selected');

				// shift click
				}else if( $rootScope.shiftKeyHeld ){

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
			});
			
	
			// when we DOUBLE click on a track (only within this scope)
			$element.dblclick( function(evt){

				// get the queue
				MopidyService.getCurrentTlTracks().then( function( tracklist ){

					var tlTrack;

					// find our double-clicked track in the tracklist
					$.each( tracklist, function(key, track){

						if( track.tlid == target.attr('data-tlid') ){

							// then play our track
							return MopidyService.playTlTrack({ tl_track: track });
						}	
					});
				});
			}
		}
	}
})

.controller('TracklistController', function TracklistController( $element, $scope, $rootScope, $stateParams, MopidyService, SpotifyService ){

});
'use strict';

angular.module('spotmop.common.tracklist', [
	'spotmop.services.mopidy'
])


.directive('track', function() {
	return {
		restrict: 'E',
		scope: {
			track: '='
		},
		templateUrl: '/app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, MopidyService ){
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){				
				if( event.which === 1 )
					leftClick( event );
				else if( event.which === 3 )
					rightClick( event );
			});
			
			/**
			 * Left click
			 * Select a track (considering shift/ctrl key holds too)
			 **/
			function leftClick( event ){
				
				// hide the context menu
				$rootScope.$broadcast('spotmop:hideContextMenu');
			
				// get the track row (even if we clicked a child element)
				var target = $(event.target);
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
			}
			
			
			/**
			 * Right click
			 * Provide context menu
			 **/
			function rightClick( event ){				
				$rootScope.$broadcast('spotmop:showContextMenu', $element, event);
			}
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){

				var trackToPlayIndex = $element.index();
				var followingTracks = $element.nextAll();
				var newTracklistUris = [];

				$.each( followingTracks, function(key,value){
					if( $(value).attr('data-uri') )
						newTracklistUris.push( $(value).attr('data-uri') );
				});

				// play the target track pronto
				MopidyService.playTrack( [$element.attr('data-uri')], 0 ).then( function(){

					// notify user that this could take some time
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'playing-from-tracklist', message: 'Adding tracks... this may take some time'});

					// add the following tracks to the tracklist
					MopidyService.addToTrackList( newTracklistUris ).then( function(response){
						$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'playing-from-tracklist'});
					});
				});

			});
		}
	}
})


.directive('tltrack', function() {
	return {
		restrict: 'E',
		templateUrl: '/app/common/tracklist/tltrack.template.html',
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
		controller: function( $element, $scope, $rootScope, MopidyService ){
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.click( function( event ){				
				if( event.which === 1 )
					leftClick( event );
				else if( event.which === 3 )
					rightClick( event );
			});
			
			/**
			 * Left click
			 * Select a track (considering shift/ctrl key holds too)
			 **/
			function leftClick( event ){
				
				// hide the context menu
				$rootScope.$broadcast('spotmop:hideContextMenu');
				
				// make track selection
				$scope.$apply( function(){
					$scope.track.selected = true;
				});
			}
			
			/**
			 * Right click
			 * Provide context menu
			 **/
			function rightClick( event ){				
				$rootScope.$broadcast('spotmop:showContextMenu', $element, event);
			}
			
			
			/**
			 * Double click
			 **/
			 
			 // CURRENTLY NOT WORKING, SINGLE CLICK INTERRUPTS THIS BEHAVIOR
			$element.dblclick( function( event ){

				// get the queue's tracks
				// we need to re-get the queue because at this point some tracks may not have tlids
				MopidyService.getCurrentTlTracks().then( function( tracklist ){

					// find our double-clicked track in the tracklist
					$.each( tracklist, function(key, track){
						if( track.tlid == $element.attr('data-tlid') ){

							// then play our track
							return MopidyService.playTlTrack({ tl_track: track });
						}	
					});
				});
			});
		}
	}
})


/**
 * Tracklist controller
 * This is the parent object for all lists of tracks (top tracks, queue, playlists, the works!)
 **/
.controller('TracklistController', function TracklistController( $element, $scope, $filter, $rootScope, $stateParams, MopidyService, SpotifyService ){

	// prevent right-click menus
	$(document).contextmenu( function(evt){
		
		// only if clicking in a tracklist
		if( $(evt.target).closest('.tracklist').length > 0 )
			return false;
	});
		
	$element.bind('click', function(event){
		
		// selected tracks: 
		console.log( $filter('filter')( $scope.currentTracklist, {selected: true} ) );
	});
			
	
	
	/**
	 * Selected Tracks >> Play
	 * We've been told to find the selected tracks, and play them immediately
	 **/
	$scope.$on('spotmop:selectedTracks:play', function(event){
		console.log( event );
	});
	
});




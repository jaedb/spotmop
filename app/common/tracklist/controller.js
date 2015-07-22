'use strict';

angular.module('spotmop.common.tracklist', [
	'spotmop.services.mopidy'
])


.directive('track', function() {
	return {
		restrict: 'E',
		templateUrl: '/app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, MopidyService ){
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
					$scope.$emit('spotmop:contextMenu:hide');
					$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click
				}else if( event.which === 3 ){
					$scope.$emit('spotmop:contextMenu:show', event, 'track');
				}
			});
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
				
				// what position track am I in the tracklist
				var myIndex = $scope.tracklist.tracks.indexOf( $scope.track );
				var trackUrisToAdd = [];
				
				// loop me, and all my following tracks, fetching their uris
				for( var i = myIndex+1; i < $scope.tracklist.tracks.length; i++ ){
					var track = $scope.tracklist.tracks[i];					
					if( typeof( track ) !== 'undefined' && typeof( track.uri ) !== 'undefined' )
						trackUrisToAdd.push( track.uri );
				}
				
				// play me (the double-clicked track) immediately
				MopidyService.playTrack( [ $scope.track.uri ], 0 ).then( function(){

					// notify user that this could take some time
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'playing-from-tracklist', message: 'Adding '+trackUrisToAdd.length+' tracks... this may take some time'});

					// add the following tracks to the tracklist
					MopidyService.addToTrackList( trackUrisToAdd ).then( function(response){
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
		},
		controller: function( $element, $scope, $rootScope, MopidyService ){
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
					$scope.$emit('spotmop:contextMenu:hide');
					$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click
				}else if( event.which === 3 ){
					$scope.$emit('spotmop:contextMenu:show', event, 'tltrack');
				}
			});			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
		
				// get the queue's tracks
				// we need to re-get the queue because at this point some tracks may not have tlids
				// TODO: simplify this and get the tracklist with a filter applied, by tlid. This will remove the need for fetching the whole tracklist, but I suspect the performance gain from this will be negligable
				MopidyService.getCurrentTlTracks().then( function( tracklist ){
					
					// find our double-clicked track in the tracklist
					$.each( tracklist, function(key, track){
						if( track.tlid == $scope.track.tlid ){

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

	
	
	/**
	 * Dragging a track
	 * This event is detected and $emitted from the track/tltrack directive
	 **/
	$scope.$on('spotmop:track:dragging', function( event ){
		
	});
			
	
	
	/**
	 * Click on a single track
	 * This event is detected and $emitted from the track/tltrack directive
	 **/
	$scope.$on('spotmop:track:clicked', function( event, $track ){
		
		// if ctrl key held down
		if( $rootScope.ctrlKeyHeld ){
			
			// toggle selection for this track
			if( $track.track.selected ){
				$track.$apply( function(){ $track.track.selected = false; });
			}else{
				$track.$apply( function(){ $track.track.selected = true; });
			}
			
		// if ctrl key not held down
		}else if( !$rootScope.ctrlKeyHeld ){
			
			// unselect all tracks
			angular.forEach( $scope.tracklist.tracks, function(track){
				track.selected = false;
			});
			
			// and select only me
			$track.$apply( function(){ $track.track.selected = true; });
		}
		
		// if shift key held down, select all tracks between this track, and the last clicked one
		if( $rootScope.shiftKeyHeld ){
			
			// figure out the limits of our selection (use the array's index)
			// assume last track clicked is the lower index value, to start with
			var firstTrackIndex = ( typeof($scope.lastClickedTrack) !== 'undefined' ) ? $scope.lastClickedTrack.$index : 0;
			var lastTrackIndex = $track.$index;
			
			// if we've selected a lower-indexed track, let's swap our limits accordingly
			if( $track.$index < firstTrackIndex ){
				firstTrackIndex = $track.$index;
				lastTrackIndex = $scope.lastClickedTrack.$index;
			}
			
			// now loop through our subset limits, and make them all selected!
			for( var i = firstTrackIndex; i <= lastTrackIndex; i++ ){
				$scope.tracklist.tracks[i].selected = true;
			};
			
			// tell our templates to re-read the arrays
			$scope.$apply();
		}
		
		// save this item to our last-clicked (used for shift-click)
		$scope.lastClickedTrack = $track;
	});
	
	
	
	/**
	 * Selected Tracks >> Add to queue
	 **/
	$scope.$on('spotmop:tracklist:enqueueSelectedTracks', function(event, playNext){
		
		var atPosition = null;
			
		// if we're adding these tracks to play next
		if( typeof( playNext ) !== 'undefined' && playNext == true ){
			
			// fetch the currently playing track
			var currentTrack = $filter('filter')( $scope.currentTracklist, {playing: true} );
			
			// make sure we got one, and then get it's position in the currentTracklist, so we can add tracks after it
			if( currentTrack.length > 0 ){
				atPosition = $scope.currentTracklist.indexOf(currentTrack[0]) + 1;
				
			// no current track, add to top of queue
			}else{
				atPosition = 0;
			}
		}
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function( track ){
			selectedTracksUris.push( track.uri );
		});
				    
		$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-queue', message: 'Adding '+selectedTracksUris.length+' tracks to queue'});
				
		MopidyService.addToTrackList( selectedTracksUris, atPosition ).then( function(response){
			$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-queue'});
		});
	});
	
	
	
	/**
	 * Selected Tracks >> Play
	 **/
	$scope.$on('spotmop:tracklist:playSelectedTracks', function(event){
		var selectedTracks = $filter('filter')( $scope.tracklist, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function(track){
			selectedTracksUris.push( track.track.uri );
		});
		
		// TODO: Implement mopidy
	});
	
	
	
	/**
	 * Selected Tracks >> Delete from queue (aka unqueue)
	 **/
	$scope.$on('spotmop:tracklist:unqueueSelectedTracks', function(event){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksTlids = [];
		
		angular.forEach( selectedTracks, function( track ){
			selectedTracksTlids.push( track.tlid );
		});
		
		MopidyService.removeFromTrackList( selectedTracksTlids );
	});
	
	
	
	/**
	 * TODO: Selected Tracks >> Delete
	 **/
	$scope.$on('spotmop:tracklist:deleteSelectedTracks', function(event){
		
		var selectedTracks = $filter('filter')( $scope.currentTracklist, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function(track){
			selectedTracksUris.push( track.track.uri );
		});
		
		// TODO: Implement mopidy for queue, and spotify for playlists that we own
	});
	
});




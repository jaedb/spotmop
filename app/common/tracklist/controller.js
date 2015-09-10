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
				
					if( !$scope.isTouchDevice() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click (only when selected)
				}else if( $scope.track.selected && event.which === 3 ){
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
			
					var message = 'Adding '+trackUrisToAdd.length+' tracks';
					if( trackUrisToAdd.length > 10 )
						message += '... this could take some time';
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'playing-from-tracklist', message: message});

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
				
					if( !$scope.isTouchDevice() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click (only when selected)
				}else if( $scope.track.selected && event.which === 3 ){
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
.controller('TracklistController', function TracklistController( $element, $scope, $filter, $rootScope, $stateParams, MopidyService, SpotifyService, DialogService ){

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
		if( $rootScope.ctrlKeyHeld || $scope.isTouchDevice() ){
			
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
			var firstTrackIndex = ( typeof($scope.lastSelectedTrack) !== 'undefined' ) ? $scope.lastSelectedTrack.$index : 0;
			var lastTrackIndex = $track.$index;
			
			// if we've selected a lower-indexed track, let's swap our limits accordingly
			if( $track.$index < firstTrackIndex ){
				firstTrackIndex = $track.$index;
				lastTrackIndex = $scope.lastSelectedTrack.$index;
			}
			
			// now loop through our subset limits, and make them all selected!
			for( var i = firstTrackIndex; i <= lastTrackIndex; i++ ){
				$scope.tracklist.tracks[i].selected = true;
			};
			
			// tell our templates to re-read the arrays
			$scope.$apply();
		}
		
		// save this item to our last-clicked (used for shift-click)
		$scope.lastSelectedTrack = $track;
		
		/**
		 * Hide/show mobile version of the context menu
		 **/
		if( $scope.isTouchDevice() ){
			if( $filter('filter')($scope.tracklist.tracks, {selected: true}).length > 0 )
				$rootScope.$broadcast('spotmop:touchContextMenu:show', $scope.tracklist.type );
			else
				$rootScope.$broadcast('spotmop:contextMenu:hide' );
		}
	});
	
	
	
	/**
	 * Selected Tracks >> Add to queue
	 **/
	$scope.$on('spotmop:tracklist:enqueueSelectedTracks', function(event, playNext){
		
		var atPosition = null;
			
		// if we're adding these tracks to play next
		if( typeof( playNext ) !== 'undefined' && playNext == true ){
		
			atPosition = 0;
			
			// fetch the currently playing track
			var currentTrack = $scope.currentTlTrack;
			
			// make sure we have a current track
			if( currentTrack ){
				var currentTrackObject = $filter('filter')($scope.currentTracklist, {tlid: currentTrack.tlid});
			
				// make sure we got the track as a TlTrack object (damn picky Mopidy API!!)
				if( currentTrackObject.length > 0 )				
					atPosition = $scope.currentTracklist.indexOf( currentTrackObject[0] ) + 1;				
			}
		}
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function( track ){
			selectedTracksUris.push( track.uri );
		});
			
		var message = 'Adding '+selectedTracks.length+' tracks to queue';
		if( selectedTracks.length > 10 )
			message += '... this could take some time';
			
		$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-queue', message: message});
				
		MopidyService.addToTrackList( selectedTracksUris, atPosition ).then( function(response){
			$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-queue'});
		});
	});
	
	
	
	/**
	 * Selected Tracks >> Play
	 **/
	 
	// listeners
	$scope.$on('spotmop:tracklist:playSelectedTracks', function(){ playSelectedTracks() });
	$scope.$on('spotmop:keyboardShortcut:enter', function(){ playSelectedTracks() });
	
	// the actual behavior
	function playSelectedTracks(){
	
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var firstSelectedTrack = selectedTracks[0];
			
		// depending on context, make the selected track(s) play
		// queue
		if( $scope.tracklist.type == 'tltrack' ){
			
			// get the queue's tracks
			// we need to re-get the queue because at this point some tracks may not have tlids
			// TODO: simplify this and get the tracklist with a filter applied, by tlid. This will remove the need for fetching the whole tracklist, but I suspect the performance gain from this will be negligible
			MopidyService.getCurrentTlTracks().then( function( tracklist ){
				
				// find our double-clicked track in the tracklist
				$.each( tracklist, function(key, track){
					if( track.tlid == firstSelectedTrack.tlid ){

						// then play our track
						return MopidyService.playTlTrack({ tl_track: track });
					}	
				});
			});
			
		// generic tracklist (playlist, top-tracks, album, etc)
		}else if( $scope.tracklist.type == 'track' ){
		
			// build an array of track uris (and subtract the first one, as we play him immediately)
			var selectedTracksUris = [];
			for( var i = 1; i < selectedTracks.length; i++ ){
				selectedTracksUris.push( selectedTracks[i].uri );
			};
			
			var message = 'Adding '+selectedTracks.length+' tracks to queue';
			if( selectedTracks.length > 10 )
				message += '... this could take some time';
				
			$rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'playing-from-tracklist', message: message, autoremove: 10000 });
				
			// play the first track immediately
			MopidyService.playTrack( [ firstSelectedTrack.uri ], 0 ).then( function(){
				
				// more tracks to add
				if( selectedTracksUris.length > 0 ){
					// add the following tracks to the tracklist
					MopidyService.addToTrackList( selectedTracksUris ).then( function(response){
						$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'playing-from-tracklist'});
					});
				}else{
					$rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'playing-from-tracklist'});
				}
			});
		}
	}
	
	
	
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
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function(track){
			selectedTracksUris.push( track.track.uri );
		});
		
		// TODO: Implement mopidy for queue, and spotify for playlists that we own
	});
	
	
	/**
	 * Selected Tracks >> Add to playlist
	 **/
	$scope.$on('spotmop:tracklist:addSelectedTracksToPlaylist', function(event){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function(track){
			
			// if we have a nested track object (ie TlTrack objects)
			if( typeof(track.track) !== 'undefined' )
				selectedTracksUris.push( track.track.uri );
			
			// nope, so let's use a non-nested version
			else
				selectedTracksUris.push( track.uri );
		});
		
        DialogService.create('addToPlaylist', $scope);
	});
	
	
	/**
	 * Selected Tracks >> Add to library
	 **/
	$scope.$on('spotmop:tracklist:addSelectedTracksToLibrary', function(event){
		
        $scope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-library', message: 'Adding to library'});
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, {selected: true} );
		var selectedTracksUris = [];
		
		angular.forEach( selectedTracks, function(track){
			
			// if we have a nested track object (ie TlTrack objects)
			if( typeof(track.track) !== 'undefined' )
				selectedTracksUris.push( SpotifyService.getFromUri('trackid', track.track.uri) );
			
			// nope, so let's use a non-nested version
			else
				selectedTracksUris.push( SpotifyService.getFromUri('trackid', track.uri) );
		});
		
		// tell spotify to go'on get
		SpotifyService.addTracksToLibrary( selectedTracksUris )
			.success( function(response){
				$scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-library'});
			})
			.error( function(response){
				$scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-library'});
				$scope.$broadcast('spotmop:notifyUser', {type: 'error', id: 'adding-to-library-error', message: response.error.message, autoremove: true});
			});	
	});
	
	
	/**
	 * Manipulate selected tracks
	 **/
	$scope.$on('spotmop:tracklist:selectAll', function(event){
		angular.forEach( $scope.tracklist.tracks, function( track ){
			track.selected = true;
		});
	});
	$scope.$on('spotmop:tracklist:unselectAll', function(event){
		angular.forEach( $scope.tracklist.tracks, function( track ){
			track.selected = false;
		});
	});
	
});




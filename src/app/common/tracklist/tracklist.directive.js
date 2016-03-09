'use strict';

angular.module('spotmop.common.tracklist', [])


/**
 * Tracklist controller
 * This is the parent object for all lists of tracks (top tracks, queue, playlists, the works!)
 **/

.directive('tracklist', function( $compile ){
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/template.html',
		scope: {
			tracks: '=',		// = means to pass through an array/object
			type: '@'			// @ means to listen for a string
		},
		link: function( $scope, element, attrs ){
		},
		controller: function( $element, $scope, $filter, $rootScope, $stateParams, MopidyService, SpotifyService, DialogService, NotifyService, SettingsService, PlayerService ){
			
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
			 * When the tracklist focus changes
			 * This is useful for when we have multiple tracklists in one state (ie My Albums)
			 * NOTE: We need to run as $rootScope otherwise we only ever listen to ourselves
			 **/
			$rootScope.$on('spotmop:tracklist:focusChanged', function( event, tracklistID ){
				
				$rootScope.tracklistInFocus = tracklistID;
				
				// if the focus has changed to a tracklist OTHER than me, I need to deselect all my tracks
				if( $scope.$id != tracklistID ){
					unselectAllTracks();
				}				
			});
			
			
			/**
			 * Click on a single track
			 * This event is detected by the track/tltrack directive
			 * We have it within the tracklist directive so we have one place that this event is handled
			 **/
			$scope.trackClicked = function( $track ){
				
				// let all fellow tracklists the focus has changed to ME
				$rootScope.$broadcast('spotmop:tracklist:focusChanged', $scope.$id);
				
				// if we're in a drag event, then we don't do nothin'
				// this drag event will be handled by the 'candrag' directive
				if( !$rootScope.dragging ){
					
					// if ctrl key held down
					if( $rootScope.ctrlKeyHeld || $rootScope.isTouchDevice() ){
						
						// toggle selection for this track
						if( $track.track.selected ){
							$track.$apply( function(){ $track.track.selected = false; });
						}else{
							$track.$apply( function(){ $track.track.selected = true; });
						}
						
					// if ctrl key not held down
					}else if( !$rootScope.ctrlKeyHeld ){
						
						// unselect all tracks
						angular.forEach( $scope.tracks, function(track){
							track.selected = false;
						});
						
						// and select only me
						$track.$apply( function(){ $track.track.selected = true; });
					}
					
					// if shift key held down, select all tracks between this track, and the last clicked one
					if( $rootScope.shiftKeyHeld ){
						
						// make sure we have an existing selection to select from
						if( typeof($scope.lastSelectedTrack) === 'undefined' ){
						
							// nope? just select me and leave it at that
							$track.$apply( function(){ $track.track.selected = true; });
							return;
						}
						
						// figure out the limits of our selection (use the array's index)
						// assume last track clicked is the lower index value, to start with
						var firstTrackIndex = $scope.lastSelectedTrack.$index;
						var lastTrackIndex = $track.$index;
						
						// if we've selected a lower-indexed track, let's swap our limits accordingly
						if( $track.$index < firstTrackIndex ){
							firstTrackIndex = $track.$index;
							lastTrackIndex = $scope.lastSelectedTrack.$index;
						}
						
						// now loop through our subset limits, and make them all selected!
						for( var i = firstTrackIndex; i <= lastTrackIndex; i++ ){
							$scope.tracks[i].selected = true;
						};
						
						// tell our templates to re-read the arrays
						$scope.$apply();
					}
					
					// save this item to our last-clicked (used for shift-click)
					$scope.lastSelectedTrack = $track;
					
					/**
					 * Hide/show mobile version of the context menu
					 **/
					if( $rootScope.isTouchDevice() ){
						if( $filter('filter')($scope.tracks, {selected: true}).length > 0 )
							$rootScope.$broadcast('spotmop:touchContextMenu:show', $scope.type );
						else
							$rootScope.$broadcast('spotmop:contextMenu:hide' );
					}
				}
			};
			
			
			
			/**
			 * Selected Tracks >> Add to queue
			 **/
			$scope.$on('spotmop:tracklist:enqueueSelectedTracks', function(event, playNext){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
				
				var atPosition = null;
					
				// if we're adding these tracks to play next
				if( typeof( playNext ) !== 'undefined' && playNext == true ){				
					atPosition = PlayerService.state().currentTracklistPosition();
				}
				
				var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
				var selectedTracksUris = [];
				
				angular.forEach( selectedTracks, function( track ){
					selectedTracksUris.push( track.uri );
				});
					
				var message = 'Adding '+selectedTracks.length+' tracks to queue';
				if( selectedTracks.length > 10 )
					message += '... this could take some time';
					
				NotifyService.notify( message );
						
				MopidyService.addToTrackList( selectedTracksUris, atPosition );
			});
			
			
			
			/**
			 * Selected Tracks >> Play
			 **/
			 
			// listeners
			$scope.$on('spotmop:tracklist:playSelectedTracks', function(){ playSelectedTracks() });
			$scope.$on('spotmop:keyboardShortcut:enter', function(){ playSelectedTracks() });
			
			// the actual behavior
			function playSelectedTracks(){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
			
				var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
				var firstSelectedTrack = selectedTracks[0];
				
				// depending on context, make the selected track(s) play
				// queue
				if( $scope.type == 'tltrack'){
					
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
				}else{
				
					// build an array of track uris (and subtract the first one, as we play him immediately)
					var selectedTracksUris = [];
					for( var i = 1; i < selectedTracks.length; i++ ){
						selectedTracksUris.push( selectedTracks[i].uri );
					};
					
					var message = 'Adding '+selectedTracks.length+' tracks to queue';
					if( selectedTracks.length > 10 )
						message += '... this could take some time';
						
					NotifyService.notify( message );
					
					// play the first track immediately
					MopidyService.playTrack( [ firstSelectedTrack.uri ], 0 ).then( function(){
						
						// more tracks to add
						if( selectedTracksUris.length > 0 ){
							// add the following tracks to the tracklist
							MopidyService.addToTrackList( selectedTracksUris );
						}
					});
				}
			}
			
			
			
			/**
			 * Selected Tracks >> Delete from queue (aka unqueue)
			 **/
			$scope.$on('spotmop:tracklist:unqueueSelectedTracks', function(event){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
				
				var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
				var selectedTracksTlids = [];
				
				angular.forEach( selectedTracks, function( track ){
					selectedTracksTlids.push( track.tlid );
				});
				
				MopidyService.removeFromTrackList( selectedTracksTlids );
			});
			
			
			/**
			 * Selected Tracks >> Add to playlist via dialog
			 **/
			$scope.$on('spotmop:tracklist:addSelectedTracksToPlaylist', function(event){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
				
				var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
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
             * Selected Tracks >> Add to playlist immediately
             **/
            $scope.$on('spotmop:tracklist:addSelectedTracksToPlaylistByUri', function(event, uri){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
                
                var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
                var selectedTracksUris = [];
				var localTracksExcluded = 0;
                
                angular.forEach( selectedTracks, function(track){
                    
                    // if we have a nested track object (ie TlTrack objects)
                    if( typeof(track.track) !== 'undefined' ){
						if( track.track.uri.substring(0,6) == 'local:' ){
							localTracksExcluded++;
						}else{
							selectedTracksUris.push( track.track.uri );
						}
                    
                    // nope, so let's use a non-nested version
                    }else{
						if( track.uri.substring(0,6) == 'local:' ){
							localTracksExcluded++;
						}else{
							selectedTracksUris.push( track.uri );
						}
					}
                });
					
				// if we have omitted some local tracks
				if( localTracksExcluded > 0 ){
					
					// if they were all local tracks
					if( selectedTracksUris.length <= 0 ){
						NotifyService.error( 'Cannot add local tracks to a Spotify playlist' );
						return false;
					}else{
						NotifyService.error( localTracksExcluded+' local tracks not added to Spotify playlist' );
					}
				}
				
                // now add them to the playlist, for reals
                SpotifyService.addTracksToPlaylist( uri, selectedTracksUris )
                    .then( function(response){
                        NotifyService.notify('Added '+selectedTracksUris.length+' tracks to playlist');
                    });
            });
			
			/**
			 * Selected Tracks >> Add to library
			 **/
			$scope.$on('spotmop:tracklist:addSelectedTracksToLibrary', function(event){
				
				// ignore if we're not the tracklist in focus
				if( $rootScope.tracklistInFocus !== $scope.$id )
					return;
				
				var selectedTracks = $filter('filter')( $scope.tracks, {selected: true} );
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
				SpotifyService.addTracksToLibrary( selectedTracksUris );
			});
			
			
			/**
			 * Manipulate selected tracks
			 **/
			 
			$scope.$on('spotmop:tracklist:selectAll', function(event){
				unselectAllTracks();
			});
			$scope.$on('spotmop:tracklist:unselectAll', function(event){
				unselectAllTracks();
			});
			function unselectAllTracks(){					
				angular.forEach( $scope.tracks, function( track ){
					track.selected = false;
				});
			}
		}
	}
});




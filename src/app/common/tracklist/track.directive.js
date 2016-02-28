'use strict';

angular.module('spotmop.common.track', [])


.directive('track', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, MopidyService, NotifyService ){
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
				
					if( !$rootScope.isTouchDevice() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					// make sure we haven't clicked on a sub-link
					if( !$(event.target).is('a') )
						$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click
				}else if( event.which === 3 ){
					
					// employ our normal click behavior (ie select this track, ctrl click, etc, etc)
					if( !$scope.track.selected )
						$scope.$emit('spotmop:track:clicked', $scope);
					
					$scope.$emit('spotmop:contextMenu:show', event, 'track');
				}
			});
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
				
				// what position track am I in the tracklist
				var myIndex = $scope.tracks.indexOf( $scope.track );
				var trackUrisToAdd = [];
				
				// loop me, and all my following tracks, fetching their uris
				for( var i = myIndex+1; i < $scope.tracks.length; i++ ){
					var track = $scope.tracks[i];					
					if( typeof( track ) !== 'undefined' && typeof( track.uri ) !== 'undefined' )
						trackUrisToAdd.push( track.uri );
				}
				
				// play me (the double-clicked track) immediately
				MopidyService.playTrack( [ $scope.track.uri ], 0 ).then( function(){
					
					if( trackUrisToAdd.length > 0 ){
					
						// notify user that this could take some time			
						var message = 'Adding '+trackUrisToAdd.length+' tracks';
						if( trackUrisToAdd.length > 10 )
							message += '... this could take some time';
						NotifyService.notify( message );

						// add the following tracks to the tracklist
						MopidyService.addToTrackList( trackUrisToAdd );
					}
				});
			});
		}
	}
})


.directive('tltrack', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/tltrack.template.html',
		link: function( $scope, element, attrs ){			
		},
		controller: function( $element, $scope, $rootScope, MopidyService, PlayerService ){
			
			$scope.state = PlayerService.state;
			
			// detect if a local file (to change the links for artists, etc)
			$scope.local = false;
			if( $scope.track.track.uri.substring(0,6) == 'local:' )
				$scope.local = true;
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
				
					if( !$rootScope.isTouchDevice() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					// make sure we haven't clicked on a sub-link
					if( !$(event.target).is('a') )
						$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click (only when selected)
				}else if( event.which === 3 ){
					
					// employ our normal click behavior (ie select this track, ctrl click, etc, etc)
					if( !$scope.track.selected )
						$scope.$emit('spotmop:track:clicked', $scope);
					
					// now reveal context menu
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


.directive('localtrack', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/localtrack.template.html',
		link: function( $scope, element, attrs ){		
		},
		controller: function( $element, $scope, $rootScope, MopidyService, PlayerService, NotifyService ){
			
			$scope.state = PlayerService.state;
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
				
					if( !$rootScope.isTouchDevice() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					// make sure we haven't clicked on a sub-link
					if( !$(event.target).is('a') )
						$scope.$emit('spotmop:track:clicked', $scope);
					
				// right click
				}else if( event.which === 3 ){
					
					// employ our normal click behavior (ie select this track, ctrl click, etc, etc)
					if( !$scope.track.selected )
						$scope.$emit('spotmop:track:clicked', $scope);
					
					$scope.$emit('spotmop:contextMenu:show', event, 'localtrack');
				}
			});		
			
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
				
				// what position track am I in the tracklist
				var myIndex = $scope.tracks.indexOf( $scope.track );
				var trackUrisToAdd = [];
				
				// loop me, and all my following tracks, fetching their uris
				for( var i = myIndex+1; i < $scope.tracks.length; i++ ){
					var track = $scope.tracks[i];					
					if( typeof( track ) !== 'undefined' && typeof( track.uri ) !== 'undefined' )
						trackUrisToAdd.push( track.uri );
				}
				
				// play me (the double-clicked track) immediately
				MopidyService.playTrack( [ $scope.track.uri ], 0 ).then( function(){
					
					if( trackUrisToAdd.length > 0 ){
					
						// notify user that this could take some time			
						var message = 'Adding '+trackUrisToAdd.length+' tracks';
						if( trackUrisToAdd.length > 10 )
							message += '... this could take some time';
						NotifyService.notify( message );

						// add the following tracks to the tracklist
						MopidyService.addToTrackList( trackUrisToAdd );
					}
				});
			});
		}
	}
});




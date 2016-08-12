'use strict';

angular.module('spotmop.common.track', [])


.directive('track', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, MopidyService, NotifyService, PlayerService ){
			
			// if we have a nested .track item (as in TlTrack objects), flatten it
			if( typeof($scope.track.track) !== 'undefined' ){
				$scope.track.uri = $scope.track.track.uri;
				$scope.track.name = $scope.track.track.name;
				$scope.track.artists = $scope.track.track.artists;
				$scope.track.album = $scope.track.track.album;
				$scope.track.length = $scope.track.track.length;
			}
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
				
					if( !$rootScope.isTouchMode() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					// make sure we haven't clicked on a sub-link, and then fire up to the tracklist
					if( !$(event.target).is('a') ){
						$scope.$parent.trackClicked( $scope );
					}
					
				// right click
				}else if( event.which === 3 ){
					
					// employ our normal click behavior (ie select this track, ctrl click, etc, etc)
					if( !$scope.track.selected ){
						$scope.$parent.trackClicked( $scope );
					}
					
					$scope.$emit('spotmop:contextMenu:show', event, 'track');
				}
			});
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
				MopidyService.playTrack( [ $scope.track.uri ], 0 );
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
			
			// if we have a nested .track item (as in TlTrack objects), flatten it
			if( typeof($scope.track.track) !== 'undefined' ){
				$scope.track.uri = $scope.track.track.uri;
				$scope.track.name = $scope.track.track.name;
				$scope.track.artists = $scope.track.track.artists;
				$scope.track.album = $scope.track.track.album;
				$scope.track.length = $scope.track.track.length;
			}
			
			// figure out if this track is currently playing
			$scope.isCurrentlyPlaying = function(){
				return ( $scope.track.tlid == $scope.state().currentTlTrack.tlid );
			}
			
			// figure out what the classes are for our source icon
			$scope.sourceIconClasses = function(){
				var source = $scope.track.uri.split(':')[0];
				var state = 'light';
				if( $scope.isCurrentlyPlaying() ){
					if( source == 'spotify' ) state = 'green';
					if( source == 'local' ) state = 'yellow';
					if( source == 'soundcloud' ) state = 'red';
				}
				return source +' '+ state;
			}
			
			/**
			 * Single click
			 * Click of any mouse button. Figure out which button, and behave accordingly
			 **/
			$element.mouseup( function( event ){
				
				// left click
				if( event.which === 1 ){
				
					if( !$rootScope.isTouchMode() )
						$scope.$emit('spotmop:contextMenu:hide');
					
					// make sure we haven't clicked on a sub-link, and then fire up to the tracklist
					if( !$(event.target).is('a') ){
						$scope.$parent.trackClicked( $scope );
					}
					
				// right click (only when selected)
				}else if( event.which === 3 ){
					
					// employ our normal click behavior (ie select this track, ctrl click, etc, etc)
					if( !$scope.track.selected ){
						$scope.$parent.trackClicked( $scope );
					}
					
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
});




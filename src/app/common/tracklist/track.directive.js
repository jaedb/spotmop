'use strict';

angular.module('spotmop.common.track', [])


.directive('track', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, MopidyService, NotifyService, PlayerService ){
			
			// fetch our player service
			$scope.state = PlayerService.state;
			
			// figure out if this track is currently playing
			$scope.isCurrentlyPlaying = function(){
				return ( typeof($scope.track.tlid) !== 'undefined' && $scope.track.tlid == $scope.state().currentTlTrack.tlid );
			}
			
			/**
			 * What type of track are we? Use our uri to figure this out
			 * @return string
			 **/
			$scope.sourceIconClasses = function(){
                if( typeof($scope.track.uri) !== 'undefined' ){
                    var source = $scope.track.uri.split(':')[0];
                    var state = 'light';
                    if( $scope.isCurrentlyPlaying() ){
                        if( source == 'spotify' ) state = 'green';
                        if( source == 'local' ) state = 'yellow';
                        if( source == 'soundcloud' ) state = 'red';
                    }
                    return source +' '+ state;
                }
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
					
					$scope.$emit('spotmop:contextMenu:show', event, $scope.$parent.type);
				}
			});
			
			
			/**
			 * Double click
			 **/
			$element.dblclick( function( event ){
				
				// tltrack
				if( $scope.$parent.type == 'tltrack' ){
						
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
				
				// non-tltrack
				}else{
					MopidyService.playTrack( [ $scope.track.uri ], 0 );
				}
			});
		}
	}
});




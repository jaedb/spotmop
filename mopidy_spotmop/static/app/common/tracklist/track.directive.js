'use strict';

angular.module('spotmop.common.track', [])


.directive('track', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/tracklist/track.template.html',
		controller: function( $element, $scope, $rootScope, $filter, MopidyService, NotifyService, PlayerService ){
			
            // parse our parent tracklist into the track itself
            // useful for detecting drag event capabilities
            $scope.track.type = $scope.$parent.type;
            
			// fetch our player service
			$scope.state = PlayerService.state;
			
			// figure out if this track is currently playing
			$scope.isCurrentlyPlaying = function(){
				return ( typeof($scope.track.tlid) !== 'undefined' && $scope.track.tlid == $scope.state().currentTlTrack.tlid );
			}
            
            // get source for this track (ie spotify, youtube, local)
            $scope.source = function(){
                var source = $filter('assetOrigin')( $scope.track.uri );
                if( source == 'local' || source == 'file' ) source = 'folder';
                return source;
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
					
					$scope.$emit('spotmop:contextMenu:show', event, $scope.track.type);
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




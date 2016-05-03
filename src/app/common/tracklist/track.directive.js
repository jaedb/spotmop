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
					
					$scope.$emit('spotmop:contextMenu:show', event, 'localtrack');
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
});




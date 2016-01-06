'use strict';

angular.module('spotmop.common.contextmenu', [
])


.directive('contextmenu', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/contextmenu/template.html',
		link: function( $scope, element, attrs ){
		},
		controller: function( $scope, $rootScope, $element ){
			
			/**
			 * Menu item functionality
			 **/
			$scope.play = function(){
				$rootScope.$broadcast('spotmop:tracklist:playSelectedTracks');
				$element.fadeOut('fast');
				
				// if we're a touch device, hide the menu now we're done with it (aka unselect all)
				if( $scope.isTouchDevice() )
					$rootScope.$broadcast('spotmop:tracklist:unselectAll');
			}
			
			$scope.enqueue = function(){
				$rootScope.$broadcast('spotmop:tracklist:enqueueSelectedTracks');
				$element.fadeOut('fast');
				
				// if we're a touch device, hide the menu now we're done with it (aka unselect all)
				if( $scope.isTouchDevice() )
					$rootScope.$broadcast('spotmop:tracklist:unselectAll');
			}
			
			$scope.unqueue = function(){
				$rootScope.$broadcast('spotmop:tracklist:unqueueSelectedTracks');
				$element.fadeOut('fast');
				
				// if we're a touch device, hide the menu now we're done with it (aka unselect all)
				if( $scope.isTouchDevice() )
					$rootScope.$broadcast('spotmop:tracklist:unselectAll');
			}
			
			$scope.playNext = function(){
				$rootScope.$broadcast('spotmop:tracklist:enqueueSelectedTracks', true);
				$element.fadeOut('fast');
				
				// if we're a touch device, hide the menu now we're done with it (aka unselect all)
				if( $scope.isTouchDevice() )
					$rootScope.$broadcast('spotmop:tracklist:unselectAll');
			}
			
			$scope.addToPlaylist = function(){
				$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToPlaylist');
				$element.fadeOut('fast');
			}
			
			$scope.removeFromPlaylist = function(){
				$rootScope.$broadcast('spotmop:tracklist:deleteSelectedTracks');
				$element.fadeOut('fast');
			}
			
			$scope.addToLibrary = function(){
				$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToLibrary');
				$element.fadeOut('fast');
			}
			
			$scope.selectAll = function(){
				$rootScope.$broadcast('spotmop:tracklist:selectAll');
			}
			
			$scope.unselectAll = function(){
				$rootScope.$broadcast('spotmop:tracklist:unselectAll');
				$element.fadeOut('fast');
			}
			
			/**
			 * Show the standard context menu
			 * This is typically triggered by a right-click on a track
			 *
			 * @param context = string (track|tltrack)
			 * @param reverse = boolean (optional) to reverse position of context menu, ie when you're on the right-boundary of the page
			 **/
			$scope.$on('spotmop:contextMenu:show', function(event, originalEvent, context, reverse){
				
				var positionY = originalEvent.pageY - $(window).scrollTop();
				var positionX = originalEvent.pageX - window.pageYOffset;
				
				if( typeof( reverse ) !== 'undefined' && reverse )
					positionX -= $element.outerWidth();
				
				// position and reveal our element
				$element
					.css({
						top: positionY,
						left: positionX + 5
					})
					.show();
				
				// use the clicked element to define what kind of context menu to show
				$scope.$apply( function(){
					$scope.context = context;
				});
			});
			
			/**
			 * Show the touch-device specific context menu
			 * This is triggered when our tracklist has selected tracks
			 *
			 * @param context = string (track|tltrack)
			 **/
			$scope.$on('spotmop:touchContextMenu:show', function(event, context){
				
				// position and reveal our element
				$element.show();
				
				// use the clicked element to define what kind of context menu to show
				$scope.$apply( function(){
					$scope.context = context;
				});
			});
			
			
			/**
			 * Hide the context menu
			 **/
			$scope.$on('spotmop:contextMenu:hide', function(event){
				$element.fadeOut('fast');
			});
		}
	}
});

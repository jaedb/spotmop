'use strict';

angular.module('spotmop.common.contextmenu', [
])


.directive('contextmenu', function() {
	return {
		restrict: 'E',
		templateUrl: 'app/common/contextmenu/template.html',
		link: function( $scope, element, attrs ){
		},
		controller: function( $scope, $rootScope, $element, $timeout ){
			
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
			
			$scope.addToPlaylistByUri = function( uri ){
				$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToPlaylistByUri', uri);
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
			$scope.$on('spotmop:contextMenu:show', function(event, originalEvent, context){
				
				// use the clicked element to define what kind of context menu to show
				$scope.$apply( function(){
				
					// apply our context, which ultimately defines what options are available
					$scope.context = context;
					
					// wait for angular to render the dom, then we position the menu
					$timeout(function(){
					
						var positionY = originalEvent.pageY - $(window).scrollTop();
						var positionX = originalEvent.pageX;
						var menuWidth = $element.outerWidth();
						var menuHeight = $element.outerHeight();
						
						// too far right
						if( positionX + menuWidth > $(window).width() ){
							positionX -= menuWidth - 10;
							$element.addClass('hard-right');					
						}else if( positionX + menuWidth + 150 > $(window).width() ){
							$element.addClass('close-right');
						}else{
							$element.removeClass('hard-right close-right');
						}
						
						// too far to the bottom
						if( positionY + menuHeight > $(window).height() ){
							positionY -= menuHeight;
							$element.addClass('hard-bottom');					
						}else if( positionY + menuHeight + 306 > $(window).height() ){
							$element.addClass('close-bottom');
						}else{
							$element.removeClass('hard-bottom close-bottom');
						}
						
						// now we can accurately reveal and position it
						$element
							.css({
								top: positionY,
								left: positionX + 5
							})
							.show();
						
					});
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

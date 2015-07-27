'use strict';

angular.module('spotmop.common.contextmenu', [
])


.directive('contextmenu', function() {
	return {
		restrict: 'E',
		templateUrl: '/app/common/contextmenu/template.html',
		link: function( $scope, element, attrs ){
		},
		controller: function( $scope, $rootScope, $element ){
			
			/**
			 * Menu item functionality
			 **/
			$scope.play = function(){
				$rootScope.$broadcast('spotmop:tracklist:playSelectedTracks');
				$element.hide();
			}
			
			$scope.enqueue = function(){
				$rootScope.$broadcast('spotmop:tracklist:enqueueSelectedTracks');
				$element.hide();
			}
			
			$scope.unqueue = function(){
				$rootScope.$broadcast('spotmop:tracklist:unqueueSelectedTracks');
				$element.hide();
			}
			
			$scope.playNext = function(){
				$rootScope.$broadcast('spotmop:tracklist:enqueueSelectedTracks', true);
				$element.hide();
			}
			
			/**
			 * Show the context menu
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
			 * Hide the context menu
			 **/
			$scope.$on('spotmop:contextMenu:hide', function(event){
				$element.hide();
			});
		}
	}
});

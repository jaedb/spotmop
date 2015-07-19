'use strict';

angular.module('spotmop.common.contextmenu', [
])


.directive('contextmenu', function() {
	return {
		restrict: 'E',
		templateUrl: '/app/common/contextmenu.template.html',
		link: function( $scope, element, attrs ){
		},
		controller: function( $scope, $rootScope, $element ){
			
			$scope.play = function(){
				$rootScope.$broadcast('spotmop:tracklist:playSelectedTracks');
			}
			
			$scope.enqueue = function(){
				$rootScope.$broadcast('spotmop:tracklist:enqueueSelectedTracks');
			}
			
			/**
			 * Show the context menu
			 * @param context = string (track|tltrack)
			 **/
			$scope.$on('spotmop:contextMenu:show', function(event, originalEvent, context){
				
				var positionY = originalEvent.pageY - $(window).scrollTop();
				var positionX = originalEvent.pageX - window.pageYOffset;
				
				$element.show().css({
					top: positionY,
					left: positionX + 5
				});
				
				// use the clicked element to define what kind of context menu to show
				$scope.context = context;				
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

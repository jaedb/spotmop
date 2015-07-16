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
						
			/**
			 * Show the context menu
			 * Someone has told us to show ourselves, but they have told us who they are (clickedElement)
			 **/
			$rootScope.$on('spotmop:showContextMenu', function(event, clickedElement, originalEvent){
			
				// get the track row (even if we clicked a child element)
				var target = $(originalEvent.target);
				if( !target.hasClass('track') )
					target = target.closest('.track');

				// add this track to the selected list
				// we can ignore ctrl/shift here, it doesn't feel UX right
				target.addClass('selected');
				
				var positionY = originalEvent.pageY - $(window).scrollTop();
				var positionX = originalEvent.pageX - window.pageYOffset;
				
				$element.show().css({
					top: positionY,
					left: positionX + 5
				});
				
				// use the clicked element to define what kind of context menu to show
				if( clickedElement.is('track') ){
					$scope.context = 'track';
				}else if( clickedElement.is('tltrack') ){
					$scope.context = 'tltrack';
				}
				
			});
			
			
			/**
			 * Hide the context menu
			 **/
			$rootScope.$on('spotmop:hideContextMenu', function(event){
				$element.hide();
			});
		}
	}
});

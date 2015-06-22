/**
 * Create a Dialog service 
 *
 * This provides the framework for fullscreen popup dialogs. We have a pre-set selection
 * of the key types of dialog.
 **/
 
angular.module('spotmop.services.dialog', [])


/**
 * Directive to handle wrapping functionality
 **/
.directive('dialog', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: {
			type: '@'
		},
		templateUrl: '/app/services/dialog/template.html',
		controller: function( $scope, $element, DialogService ){
			$scope.title = $scope.type;
			
			// listen for <esc> keypress
			$(document).on('keyup', function(evt){
				if( evt.keyCode == 27 ){
					DialogService.remove();
				}
			});
		}
	};
})


/**
 * Service to facilitate the creation and management of dialogs globally
 **/
.factory("DialogService", ['$rootScope', '$compile', '$interval', '$timeout', function( $rootScope, $compile, $interval, $timeout ){
	
	// setup response object
    return {
		create: function( dialogType ){
			$('body').append($compile('<dialog type="'+dialogType+'" />')( $rootScope ));
		},
		remove: function(){
			$('body').children('.dialog').fadeOut( 200, function(){ $(this).remove() } );
		}
	};
}]);






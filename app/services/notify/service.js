/**
 * Notifications service
 *
 * Provides framework of simple user-oriented notification messages
 **/
 
angular.module('spotmop.services.notify', [])


/**
 * Service to facilitate the creation and management of dialogs globally
 **/
.factory("NotifyService", ['$rootScope', '$compile', '$interval', '$timeout', function( $rootScope, $compile, $interval, $timeout ){
    
	// setup response object
    return {
	
		/**
		 * Create a new notification item
		 * @param type = string (loader, good, bad, keyboard-shortcut, etc)
		 * @param message = string (body of message)
		 * @param icon = string (icon type to use) optional
		 * @param duration = int (how long to hold message) optional
		 **/
		create: function( type, message, durationm, icon ){
		
			if( typeof(duration) === 'undefined' )
				var duration = 2500;
				
			// if we're a keyboard shortcut notification, this requires icon injection
			if( type == 'keyboard-shortcut' ){
				message = '<i class="fa fa-'+icon+'"></i>';
			}
			
			var notification = $('<notification class="notification '+type+'">'+message+'</notification>');
			$('#notifications').append( notification );
			
			// hide in when we meet our duration
			// remember that we can disable hide by parsing duration=false
			if( duration )
				$timeout(
					function(){
						notification.fadeOut(200, function(){ notification.remove() } );
					},
					duration
				);
		}
	};
}])


/**
 * Behavior for the notification itself
 **/
.directive("notification", function(){
	
	return {		
		restrict: 'AE',
		link: function($scope, $element, $attrs){
			console.log( $element );
		}
	}
});









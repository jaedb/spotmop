/**
 * Notifications service
 *
 * Provides framework of simple user-oriented notification messages.
 * Also includes HTML5 browser notifications.
 **/
 
angular.module('spotmop.services.notify', [])


/**
 * Service to facilitate the creation and management of dialogs globally
 **/
.factory("NotifyService", ['$rootScope', '$compile', '$interval', '$timeout', 'SettingsService', function( $rootScope, $compile, $interval, $timeout, SettingsService ){
    
	// setup response object
    return {
	
		/**
		 * Create a new notification item
		 * @param message = string (body of message)
		 * @param duration = int (how long to hold message) optional
		 **/
		notify: function( message, duration ){
		
			if( typeof(duration) === 'undefined' )
				var duration = 2500;
			
			var notification = $('<notification class="notification default">'+message+'</notification>');
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
		},
	
		/**
		 * Error message
		 * @param icon = string (icon type to use)
		 * @param duration = int (how long to hold message) optional
		 **/
		error: function( message, duration ){
		
			if( typeof(duration) === 'undefined' )
				var duration = 2500;
			
			var notification = $('<notification class="notification error">'+message+'</notification>');
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
		},
		
		/**
		 * When we want to notify the user that they need to pull finger and authenticate with Spotify
		 **/
		spotifyAuthenticationError: function(){
			this.error( 'Please authenticate with Spotify - you can find this under settings' );
		},
	
		/**
		 * When a shortcut is triggered, notify, growl styles
		 * @param icon = string (icon type to use)
		 **/
		shortcut: function( icon ){
			
			$('#notifications').find('notification.keyboard-shortcut').remove();
			
			var notification = $('<notification class="notification keyboard-shortcut"><i class="fa fa-'+icon+'"></i></notification>');
			$('#notifications').append( notification );
			
			$timeout(
				function(){
					notification.fadeOut(200, function(){ notification.remove() } );
				},
				1500
			);
		},
		
		/**
		 * HTML5 browser notifications
		 * @param title = string
		 * @param body = string
		 * @param icon = string (optional)
		 **/
		browserNotify: function( title, body, icon ){
            
            // handle null icon
			if( typeof(icon) === 'undefined' ) icon = '';
				
			// disabled by user
			if( SettingsService.getSetting('notificationsDisabled') ) return false;
	
			// Determine the correct object to use
			var notification = window.Notification || window.mozNotification || window.webkitNotification;
            
			// not supported
			if ('undefined' === typeof notification) return false;

			// The user needs to allow this
			if ('undefined' !== typeof notification) notification.requestPermission(function(permission){});
			
			var trackNotification = new notification(
				title,
				{
					body: body,
					dir: 'auto',
					lang: 'EN',
					tag: 'spotmopNotification', 
					icon: icon
				}
			);
			
			return true;
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









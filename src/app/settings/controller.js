'use strict';

angular.module('spotmop.settings', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
		
	$stateProvider
		.state('settings', {
			url: "/settings",
			templateUrl: "app/settings/template.html"
		})
		.state('testing', {
			url: "/testing",
			templateUrl: "app/settings/testing.template.html"
		});
})
	
/**
 * Main controller
 **/	
.controller('SettingsController', function SettingsController( $scope, $http, $rootScope, $timeout, MopidyService, SpotifyService, SettingsService, NotifyService, PusherService ){
	
	// load our current settings into the template
	$scope.version;
	$scope.settings = SettingsService;
    $scope.pusher = PusherService;
	$scope.subpageNavigate = function( subpage ){
		$scope.currentSubpage = subpage;
	};
	$scope.upgrade = function(){
		$scope.upgrading = true;
		PusherService.query({ action: 'perform_upgrade' })
			.then( function(response){
				$scope.upgrading = false;
			});
	}
	$scope.resetSettings = function(){
		NotifyService.notify( 'All settings reset... reloading' );		
		localStorage.clear();		
		location.reload();
	};
	
	/**
	 * Send configuration to another connection
	 **/
	$scope.pushConfig = function( connection ){
		PusherService.broadcast({
			action: 'config_push',
			recipients: [ connection.connectionid ],
            data: {
                mopidy: SettingsService.getSetting('mopidy'),
                spotify: SettingsService.getSetting('spotify'),
                pusher: SettingsService.getSetting('pusher')
            }
		});
	};
	
	// save the fields to the localStorage
	// this is fired when an input field is blurred
	$scope.saveField = function( event ){
		SettingsService.setSetting( $(event.target).attr('name'), $(event.target).val() );
	};
	
	$scope.savePusherName = function( name ){
	
		// update our setting storage
		SettingsService.setSetting( 'pusher.name', name );
		
		// and go tell the server to update
		PusherService.query({
			type: 'query',
			action: 'change_username', 
			data: name
		});
	};
})


/**
 * Testing controller
 * Accessed only by direct URL (/testing) for testing the system
 **/	
.controller('TestingController', function SettingsController( $scope, $http, $rootScope, $timeout, MopidyService, SpotifyService, SettingsService, NotifyService, PusherService ){
	
	$scope.mopidyTest = {
			method: 'mopidy.library.browse',
			payload: '{"uri":"local:artist:md5:2cbd40f39c692153d24a3a3a5fe8c04a"}',
			run: function(){
				console.info('Testing method: '+$scope.mopidyTest.method);
				MopidyService.testMethod( $scope.mopidyTest.method, JSON.parse( $scope.mopidyTest.payload ) )
					.then( function(response){
						console.table(response);
						$scope.response = response;
					});
			}
		}
	
	$scope.pusherTest = {
			payload: '{"type":"broadcast", "action": "notification", "recipients":["'+SettingsService.getSetting('pusher.connectionid')+'"], "data":{ "title":"Title","body":"Test notification","icon":"http://lorempixel.com/100/100/nature/"}}',
			run: function(){
                var data = JSON.parse($scope.pusherTest.payload);
                if( data['type'] == 'broadcast' ){
                    PusherService.broadcast( data );
                    $scope.response = {status: 'sent', data: data };
                }else{
                    PusherService.query( data )
                        .then( function(response){
                            $scope.response = response;
                        });
                }
			}
		}
	
});

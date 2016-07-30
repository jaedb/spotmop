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
	$scope.storage = SettingsService.getSettings();
	$scope.currentSubpage = 'mopidy';
	$scope.subpageNavigate = function( subpage ){
		$scope.currentSubpage = subpage;
	};
	$scope.authorizeSpotify = function(){
		SpotifyService.authorize();
	};
    $scope.refreshSpotifyToken = function(){
		NotifyService.notify( 'Refreshing token' );
        SpotifyService.refreshToken().then( function(){});
    };
    $scope.spotifyLogout = function(){
        SpotifyService.logout();
    };
	$scope.upgradeCheck = function(){
		NotifyService.notify( 'Checking for updates' );
		SettingsService.upgradeCheck()
			.then( function(response){				
				SettingsService.setSetting('version.latest', response);
				if( SettingsService.getSetting('version.installed') < response ){
					SettingsService.setSetting('version.upgradeAvailable',true);
					NotifyService.notify( 'Upgrade is available!' );
				}else{
					SettingsService.setSetting('version.upgradeAvailable',false);
					NotifyService.notify( 'You\'re already running the latest version' );
				}
			});
	}
	$scope.upgrade = function(){
		NotifyService.notify( 'Upgrade started' );
		SettingsService.upgrade()
			.then( function(response){				
				if( response.status == 'error' ){
					NotifyService.error( response.message );
				}else{
					NotifyService.notify( response.message );
					SettingsService.setSetting('version.upgradeAvailable', false);
				}
			});
	}
	$scope.resetSettings = function(){
		NotifyService.notify( 'All settings reset... reloading' );		
		localStorage.clear();		
		location.reload();
	};
	
	SettingsService.getVersion()
		.then( function(response){
			if( response.status != 'error' ){
				SettingsService.setSetting('version.installed',response.currentVersion);
				SettingsService.setSetting('version.root',response.root);
			}
		});
	
	// save the fields to the localStorage
	// this is fired when an input field is blurred
	$scope.saveField = function( event ){
		SettingsService.setSetting( $(event.target).attr('name'), $(event.target).val() );
	};	
	$scope.savePusherName = function( name ){
		PusherService.setMe( name );
		SettingsService.setSetting( 'pusher.name', name );
	};	
    
    function updatePusherConnections(){
        PusherService.getConnections()
            .then( function(connections){
                console.log( connections );
                $scope.pusherConnections = connections;
            });
    }
    
    // update whenever setup is completed, or another client opens a connection
    updatePusherConnections();
    $rootScope.$on('spotmop:pusher:client_connected', function(event, data){ updatePusherConnections(); });
    $rootScope.$on('spotmop:pusher:client_disconnected', function(event, data){ updatePusherConnections(); });
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
			payload: '{"type":"notification","client":{"id":"'+SettingsService.getSetting('pusher.id')+'"},"title":"Title","body":"Test notification"}',
			run: function(){
				PusherService.send( JSON.parse($scope.pusherTest.payload) );
				$scope.response = {status: 'sent', payload: JSON.parse($scope.pusherTest.payload) };
			}
		}
	
});

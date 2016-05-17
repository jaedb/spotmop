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
	$scope.settings = SettingsService.getSettings();
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
				SettingsService.setSetting('version', response, 'latest');
				if( SettingsService.getSetting('version', 0, 'installed') < response ){
					SettingsService.setSetting('version',true,'upgradeAvailable');
					NotifyService.notify( 'Upgrade is available!' );
				}else{
					SettingsService.setSetting('version',false,'upgradeAvailable');
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
					SettingsService.setSetting('version',false,'upgradeAvailable');
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
				SettingsService.setSetting('version',response.currentVersion,'installed');
				SettingsService.setSetting('version',response.root,'root');
			}
		});
	
	// save the fields to the localStorage
	// this is fired when an input field is blurred
	$scope.saveField = function( event ){
		SettingsService.setSetting( $(event.target).attr('name'), $(event.target).val() );
	};	
	$scope.savePusherName = function( name ){
		PusherService.setMe( name );
		SettingsService.setSetting( 'pushername', name );
	};	
    
    PusherService.getConnections()
        .then( function(connections){
            $scope.clientConnections = connections;
        });
})


/**
 * Testing controller
 * Accessed only by direct URL (/testing) for testing the system
 **/	
.controller('TestingController', function SettingsController( $scope, $http, $rootScope, $timeout, MopidyService, SpotifyService, SettingsService, NotifyService, PusherService ){
	
	$scope.method = 'mopidy.library.browse';
	$scope.payload = '{"uri":"local:artist:md5:2cbd40f39c692153d24a3a3a5fe8c04a"}';
	$scope.data = {};
	
	$scope.run = function(){
		console.info('Testing method: '+$scope.method);
		MopidyService.testMethod($scope.method, JSON.parse( $scope.payload ) )
			.then( function(response){
				console.table(response);
				$scope.data = response;
			});
	}
	
});

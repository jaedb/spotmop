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
		});
})
	
/**
 * Main controller
 **/	
.controller('SettingsController', function SettingsController( $scope, $http, $rootScope, $timeout, MopidyService, SpotifyService, EchonestService, SettingsService, NotifyService ){
	
	// load our current settings into the template
	$scope.version;
	$scope.settings = SettingsService.getSettings();
	$scope.currentSubpage = 'mopidy';
	$scope.subpageNavigate = function( subpage ){
		$scope.currentSubpage = subpage;
	};
    $scope.refreshSpotifyToken = function(){
		NotifyService.notify( 'Refreshing token' );
        SpotifyService.refreshToken().then( function(){});
    };
    $scope.spotifyLogout = function(){
        SpotifyService.logout();
    };
	$scope.upgrade = function(){
		NotifyService.notify( 'Upgrade started' );
		SettingsService.upgrade()
			.then( function(response){				
				if( response.status == 'error' )
					NotifyService.error( response.message );
				else
					NotifyService.notify( response.message );
			});
	}
	$scope.toggleSetting = function( setting ){
    	if( SettingsService.getSetting(setting, false) ){
            SettingsService.setSetting(setting, false);
			
			// handle server switches
			switch( setting ){
				case 'mopidyconsume':
					MopidyService.setConsume( false );
					break;
				case 'echonestenabled':
					EchonestService.stop();
					break;
			}
        }else{
            SettingsService.setSetting(setting, true);
			
			// handle server switches
			switch( setting ){
				case 'mopidyconsume':
					MopidyService.setConsume( true );
					break;
				case 'echonestenabled':
					EchonestService.start();
					break;
			}
        }
	};
	
	// listen for changes from other clients
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		MopidyService.getConsume().then( function( isConsume ){
			SettingsService.setSetting('mopidyconsume',isConsume);
		});
	});
	
	$scope.deleteEchonestTasteProfile = function( confirmed ){
		if( confirmed ){
			NotifyService.notify( 'Profile deleted and Echonest disabled' );
			SettingsService.setSetting('echonesttasteprofileid',null);
            EchonestService.stop();			
		}
	};
	$scope.resetSettings = function(){
		NotifyService.notify( 'All settings reset... reloading' );		
		localStorage.clear();		
		window.location = window.location;
	};
	
	SettingsService.getVersion()
		.then( function(response){
			$scope.version = response;
		});
	
	// save the fields to the localStorage
	// this is fired when an input field is blurred
	$scope.saveField = function( event ){
		SettingsService.setSetting( $(event.target).attr('name'), $(event.target).val() );
	};
	
});

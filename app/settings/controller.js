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
.controller('SettingsController', function SettingsController( $scope, $rootScope, $timeout, MopidyService, SpotifyService, EchonestService, SettingsService ){
	
	// load our current settings into the template
	$scope.version;
	$scope.settings = SettingsService.getSettings();
	$scope.currentSubpage = 'mopidy';
	$scope.subpageNavigate = function( subpage ){
		$scope.currentSubpage = subpage;
	};
    $scope.refreshSpotifyToken = function(){
        $rootScope.requestsLoading++;
		NotifyService.create( 'loading', 'Refreshing token' );
        $.when(SpotifyService.getNewToken()).then( function(){
            $rootScope.requestsLoading--;
        });
    };
    $scope.spotifyLogout = function(){
        SpotifyService.logout();
		$scope.$parent.spotifyOnline = false;
		NotifyService.create( 'loading', 'Logging you out' );
    };
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
	
	// commands to parse to the mopidy server
	$scope.startMopidyServer = function(){
		if( !$scope.isSameDomainAsMopidy() ){
			NotifyService.create( 'error', 'Button disabled' );
			return false;
		}
		
		MopidyService.startServer()
			.success( function(response){
				NotifyService.create( 'loading', 'Attempting to start Mopidy server' );
				$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: 'Attempting to start Mopidy server'});	
			})
			.error( function(response){
				NotifyService.create( 'error', response.responseText );
			});
	};
	$scope.restartMopidyServer = function(){
		if( !$scope.isSameDomainAsMopidy() ){
			NotifyService.create( 'error', 'Button disabled' );
			return false;
		}
		
		MopidyService.restartServer()
			.success( function(response){
				console.log( response );
			})
			.error( function(response){
				NotifyService.create( 'error', response.responseText );
			});
	};
	$scope.stopMopidyServer = function(){
		if( !$scope.isSameDomainAsMopidy() ){
			NotifyService.create( 'error', 'Button disabled' );
			return false;
		}
		
		MopidyService.stopServer()
			.success( function(response){
				console.log( response );
			})
			.error( function(response){
				NotifyService.create( 'error', response.responseText );
			});
	};
	
	// listen for changes from other clients
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		MopidyService.getConsume().then( function( isConsume ){
			SettingsService.setSetting('mopidyconsume',isConsume);
		});
	});
	
	$scope.deleteEchonestTasteProfile = function( confirmed ){
		if( confirmed ){
			NotifyService.create( false, 'Profile deleted and Echonest disabled' );
			SettingsService.setSetting('echonesttasteprofileid',null);
            EchonestService.stop();			
		}
	};
	$scope.resetSettings = function(){
		NotifyService.create( false, 'All settings reset... reloading' );		
		localStorage.clear();		
		window.location = window.location;
	};
	
	SettingsService.getVersion()
		.success( function(response){
			$scope.version = response;
		});
	
	// save the fields to the localStorage
	// this is fired when an input field is blurred
	$scope.saveField = function( event ){
		SettingsService.setSetting( $(event.target).attr('name'), $(event.target).val() );
	};
	
});

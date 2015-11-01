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
        $rootScope.$broadcast('spotmop:notifyUser', {id: 'refreshtoken', message: "Refreshing token", type: 'loading', autoremove: true});
        $.when(SpotifyService.getNewToken()).then( function(){
            $rootScope.requestsLoading--;
        });
    };
    $scope.spotifyLogout = function(){
        SpotifyService.logout();
		$scope.$parent.spotifyOnline = false;
        $rootScope.$broadcast('spotmop:notifyUser', {id: 'spotify-loggingout', message: "Logging you out"});
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
			$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: 'Button disabled', type: 'error', autoremove: true});	
			return false;
		}
		
		$rootScope.requestsLoading++;
		
		MopidyService.startServer()
			.success( function(response){
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: 'Attempting to start Mopidy server'});	
			})
			.error( function(response){
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: response.responseText, type: 'error'});	
			});
	};
	$scope.restartMopidyServer = function(){
		if( !$scope.isSameDomainAsMopidy() ){
			$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: 'Button disabled', type: 'error', autoremove: true});	
			return false;
		}
		
		$rootScope.requestsLoading++;
		
		MopidyService.restartServer()
			.success( function(response){
				console.log( response );
				$rootScope.requestsLoading--;	
			})
			.error( function(response){
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: response.responseText, type: 'error'});	
			});
	};
	$scope.stopMopidyServer = function(){
		if( !$scope.isSameDomainAsMopidy() ){
			$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: 'Button disabled', type: 'error', autoremove: true});	
			return false;
		}
		
		$rootScope.requestsLoading++;
		
		MopidyService.stopServer()
			.success( function(response){
				console.log( response );
				$rootScope.requestsLoading--;
			})
			.error( function(response){
				$rootScope.requestsLoading--;
				$rootScope.$broadcast('spotmop:notifyUser', {id: 'mopidyserver', message: response.responseText, type: 'error'});	
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
			$rootScope.$broadcast('spotmop:notifyUser', {
				id: 'delete-echonest-profile',
				message: "Profile deleted and Echonest disabled",
				autoremove: true
			});
			SettingsService.setSetting('echonesttasteprofileid',null);
            EchonestService.stop();			
		}
	};
	$scope.resetSettings = function(){
		$rootScope.$broadcast('spotmop:notifyUser', {id: 'reset-settings', message: "All settings reset... reloading"});			
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

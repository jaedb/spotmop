'use strict';

angular.module('spotmop.settings', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
		
	$stateProvider
		.state('settings', {
			url: "/settings",
            abstract: true,
			templateUrl: "app/settings/template.html",
            controller: ['$scope', '$state', 
                function( $scope, $state) {
					// if we're at the index level, go to the mopidy sub-state by default
					// this prevents re-routing on refresh even if the URL is a valid sub-state
					if( $state.current.name === 'settings' )
                    	$state.go('settings.mopidy');
                }]
		})
		.state('settings.mopidy', {
			url: "",
			templateUrl: "app/settings/mopidy.template.html"
		})
		.state('settings.spotify', {
			url: "/spotify",
			templateUrl: "app/settings/spotify.template.html"
		})
		.state('settings.echonest', {
			url: "/echonest",
			templateUrl: "app/settings/echonest.template.html"
		})
		.state('settings.info', {
			url: "/info",
			templateUrl: "app/settings/info.template.html"
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
			if( setting == 'mopidyconsume' )
				MopidyService.setConsume( false );
        }else{
            SettingsService.setSetting(setting, true);
			
			// handle server switches
			if( setting == 'mopidyconsume' )
				MopidyService.setConsume( true );
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
	
    $scope.toggleEchonestEnabled = function(){
    	if( $scope.settings.echonestenabled ){
            EchonestService.stop();
        }else{
			$rootScope.requestsLoading++;	
            EchonestService.start();
        }
    };
	
	// listen for changes to the echonestOnline switch (ie we've just enabled it, now listen for success)
	$scope.$watch(
		// the value function
		function( $scope ){
			return $scope.echonestOnline
		},
		// and the processor function
		function(newState, oldState){
			if( newState === true )
				$rootScope.requestsLoading--;
		}
	);
	
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
		$rootScope.requestsLoading++;
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

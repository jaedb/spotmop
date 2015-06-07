'use strict';

angular.module('spotmop.settings', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/settings", {
        templateUrl: "app/settings/template.html",
        controller: "SettingsController"
    });
})
	
.controller('SettingsController', function SettingsController( $scope, $rootScope, $timeout, MopidyService, SpotifyService, EchonestService, SettingsService ){
	
	// load our current settings into the template
	$scope.version;
	$scope.settings = SettingsService.getSettings();
	$scope.currentSubpage = 'mopidy';
	$scope.subpageNavigate = function( subpage ){
		$scope.currentSubpage = subpage;
	};
    $scope.refreshSpotifyToken = function(){
        $rootScope.$broadcast('spotmop:notifyUser', {id: 'refreshtoken', message: "Refreshing token", type: 'loading'});
        $.when(SpotifyService.getNewToken()).then( function(){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'refreshtoken'});
        });
    };
    $scope.spotifyLogout = function(){
        SpotifyService.logout();
        $rootScope.$broadcast('spotmop:notifyUser', {id: 'spotify-loggingout', message: "Logging you out", type: 'bad loading'});
        $timeout( function(){ window.location = window.location }, 1000 );
    };
    $scope.toggleMopidyConsume = function(){
    	if( $scope.settings.mopidyconsume ){
            MopidyService.setConsume( false ).then( function(){
                SettingsService.setSetting('mopidyconsume',false);
            });
        }else{
            MopidyService.setConsume( true ).then( function(){
                SettingsService.setSetting('mopidyconsume',true);
            });
        }
    };
    $scope.toggleEchonestEnabled = function(){
    	if( $scope.settings.echonestenabled ){
            EchonestService.stop();
        }else{
            EchonestService.start();
        }
    };
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
	$scope.resetSettings = function( confirmed ){
		if( confirmed ){
			$rootScope.$broadcast('spotmop:notifyUser', {id: 'reset-settings', message: "All settings reset... reloading"});			
			localStorage.clear();		
			window.location = window.location;
		}
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
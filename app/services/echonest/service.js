/**
 * Create an Echonest service
 *
 * This holds all of the Echonest API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.echonest', [])

.factory("EchonestService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', 'SettingsService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, SettingsService ){
    
    var baseURL = 'http://developer.echonest.com/api/v4/';
    var apiKey = SettingsService.getSetting('echonestapikey','YVW64VSEPEV93M4EG');
	
	// setup response object
    return {
        
        isOnline: false,
        
        start: function(){
            
            SettingsService.setSetting('echonestenabled',true);
            
            // if we don't have a taste profile, make one
            if( !SettingsService.getSetting('echonesttasteprofileid',false) ){
                this.createTasteProfile()
                    .success( function(response){ 
                        SettingsService.setSetting('echonesttasteprofileid', response.response.id);
                        this.isOnline = true;
                        $rootScope.echonestOnline = true;
                    })
                    .error( function(error){
                        this.isOnline = false;
                        $rootScope.echonestOnline = false;
                    });
            }else{
                this.getTasteProfile( SettingsService.getSetting('echonesttasteprofileid',false) )
                    .success( function(response){
                        this.isOnline = true;
                        $rootScope.echonestOnline = true;
                    })
                    .error( function(error){
                        this.isOnline = false;
                        $rootScope.echonestOnline = false;
                    });
            }
        },
        
        stop: function(){            
            SettingsService.setSetting('echonestenabled',false);            
            $rootScope.echonestOnline = false;
        },
        
        /**
         * Taste Profile
         **/
		createTasteProfile: function(){
            return $.ajax({
                url: baseURL+'catalog/create',
                method: "POST",
                data: {
                        api_key: apiKey,
                        format: 'json',
                        type: 'general',
                        name: 'spotmop:' + Date.now() + Math.round((Math.random() + 1) * 1000),
                    }
            });
        },
        
		getTasteProfile: function( profileid ){
            return $.ajax({
                url: baseURL+'tasteprofile/read?api_key='+apiKey+'&id='+profileid,
                method: "GET"
            });
        }
	};
}]);






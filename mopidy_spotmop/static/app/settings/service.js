/**
 * Create a Settings service
 *
 * This holds all of the calls for system settings, local storage included
 **/
 
angular.module('spotmop.services.settings', [])

.factory("SettingsService", ['$rootScope', '$localStorage', '$interval', '$http', '$q', function( $rootScope, $localStorage, $interval, $http, $q ){
	
	// make sure we have a settings container
	if( typeof( $localStorage.settings ) === 'undefined' )
		$localStorage.settings = {};
    
	// setup response object
	service = {
		
		setSetting: function( setting, value ){
			// unsetting?
			if( ( typeof(value) === 'string' && value == '' ) || typeof(value) === 'undefined' )
				delete $localStorage.settings[setting];			
			// setting
            else
				$localStorage.settings[setting] = value;
		},
		
		getSetting: function( setting, defaultValue ){
			if( typeof($localStorage.settings[setting]) !== 'undefined' )
				return $localStorage.settings[setting];
			return defaultValue;
		},
		
		getSettings: function(){
			return $localStorage.settings;
		},
		
		
		/**
		 * Client identification details
         * TODO: CORS issue, so have to use $.ajax
		 **/	
		getClient: function(){
            return service.getSetting('client', {ip: null, name: 'User'});
		},
		setClient: function( parameter, value ){
            // make sure we have a settings container
            if( typeof( $localStorage.settings.client ) === 'undefined' )
                $localStorage.settings.client = {};
            $localStorage.settings.client[parameter] = value;
		},
        
		getUser: function( username ){            
            var deferred = $q.defer();
            $http({
					method: 'GET',
					url: urlBase+'users'
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });
            return deferred.promise;
		},
        
		setUser: function( username ){		
            return $.ajax({
                url: urlBase+'users',
                method: "POST",
                data: '{"name":"'+ username +'"}'
            });
		},
		
		
		/**
		 * Identify the client, by IP address
		 **/
		identifyClient: function(){
            var deferred = $q.defer();
            $http({
					method: 'GET',
					url: urlBase+'pusher/me'
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });				
            return deferred.promise;
		},
		
		
		/**
		 * Perform a Spotmop upgrade
		 **/
		upgrade: function(){			
            var deferred = $q.defer();
            $http({
					method: 'POST',
					url: urlBase+'upgrade'
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });				
            return deferred.promise;
		},
		
		
		/**
		 * Identify our current Spotmop version
		 **/
		getVersion: function(){
            var deferred = $q.defer();
            $http({
					method: 'GET',
					url: urlBase+'upgrade'
				})
                .success(function( response ){					
                    deferred.resolve( response );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });				
            return deferred.promise;
		}
	};
		
	// build the endpoint string
	var urlBase = 'http://'+ service.getSetting('mopidyhost', window.location.hostname);
	urlBase += ':'+ service.getSetting('mopidyport', '6680');
	urlBase += '/spotmop/';
	
	return service;	
}]);






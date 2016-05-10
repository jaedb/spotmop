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
		
		/**
		 * Set a setting
		 * @param setting = string (the setting to change)
		 * @param value = the setting's new value
		 * @param property = string (optional sub-property)
		 **/
		setSetting: function( setting, value, property ){
			
			if( typeof(property) === 'undefined')
				property = false;
			
			// unsetting?
			if( ( typeof(value) === 'string' && value == '' ) || typeof(value) === 'undefined' ){
				if( property ){
					delete $localStorage.settings[setting][property];
				}else{
					delete $localStorage.settings[setting];	
				}
			// setting
            }else{
				if( property ){
					if( typeof($localStorage.settings[setting]) === 'undefined' )
						$localStorage.settings[setting] = {};
					$localStorage.settings[setting][property] = value;
				}else{
					$localStorage.settings[setting] = value;
				}
			}
		},
		
		
		/**
		 * Get a setting
		 * @param setting = string (the setting to fetch)
		 * @param value = the settings default value (if the setting is undefined)
		 * @param property = string (optional sub-property)
		 **/
		getSetting: function( setting, defaultValue, property ){
            
			if( typeof(property) === 'undefined')
				property = false;
			
            // if we're getting a sub-property
			if( property ){
                
                // make sure our parent property, and sub-property exist
				if( typeof($localStorage.settings[setting]) !== 'undefined' && typeof($localStorage.settings[setting][property]) !== 'undefined' ){
					return $localStorage.settings[setting][property];
				}
			}else{
				if( typeof($localStorage.settings[setting]) !== 'undefined' ){
					return $localStorage.settings[setting];
				}
			}
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
		 * Spotmop extension upgrade
		 **/
		upgradeCheck: function(){			
            var deferred = $q.defer();
            $http({
					method: 'GET',
					url: 'https://pypi.python.org/pypi/Mopidy-Spotmop/json'
				})
                .success(function( response ){					
                    deferred.resolve( response.info.version );
                })
                .error(function( response ){					
					NotifyService.error( response.error.message );
                    deferred.reject( response.error.message );
                });				
            return deferred.promise;
		},
		
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
		
		// perform post-upgrade commands
		runUpgrade: function(){
			
			// depreciated settings
			SettingsService.setSetting('spotmop','','emulateTouchDevice');
			SettingsService.setSetting('spotmop','default','pointerMode');
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






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
		
		setSetting: function( $setting, $value ){			
			// unsetting?
			if( ( typeof($value) === 'string' && $value == '' ) || typeof($value) === 'undefined' )
				delete $localStorage.settings[$setting];			
			// setting
			else
				$localStorage.settings[$setting] = $value;
		},
		
		getSetting: function( $setting, $default ){	
			if( typeof($localStorage.settings[$setting]) !== 'undefined' )
				return $localStorage.settings[$setting];
			return $default;
		},
		
		getSettings: function(){
			return $localStorage.settings;
		},
		
		
		/**
		 * Client identification details
		 **/		
		getClient: function(){
			return this.getSetting('client', { ip: null, name: 'User', clientmap: [] });
		},		
		setClient: function( client ){			
			var name = 'User';
			for( var i = 0; i < client.clientmap.length; i++ ){
				if( client.clientmap[i].ip == client.ip )
					name = client.clientmap[i].name;
			}
			client.name = name;
			service.setSetting('client', client);
			return client;
		},
		
		
		/**
		 * Identify the client, by IP address
		 **/
		identifyClient: function(){			
            var deferred = $q.defer();
            $http({
					method: 'GET',
					url: urlBase+'identify'
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






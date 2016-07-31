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
		 **/
		setSetting: function( setting, value ){
			
			if( typeof($localStorage) === 'undefined' ) $localStorage = {};
			
			var settingElements = setting.split('.');
			var oldValue = false;
			
			switch( settingElements.length ){
				case 1:
					oldValue = $localStorage[settingElements[0]];
					$localStorage[settingElements[0]] = value;
					break;
				case 2:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' ) $localStorage[settingElements[0]] = {};
					
					oldValue = $localStorage[settingElements[0]][settingElements[1]];
					$localStorage[settingElements[0]][settingElements[1]] = value;
					break;
				case 3:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' )
						$localStorage[settingElements[0]] = {};
					if( typeof($localStorage[settingElements[0]][settingElements[1]]) === 'undefined' )
						$localStorage[settingElements[0]][settingElements[1]] = {};
						
					oldValue = $localStorage[settingElements[0]][settingElements[1]][settingElements[2]];
					$localStorage[settingElements[0]][settingElements[1]][settingElements[2]] = value;
					break;
				case 3:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' )
						$localStorage[settingElements[0]] = {};
					if( typeof($localStorage[settingElements[0]][settingElements[1]]) === 'undefined' )
						$localStorage[settingElements[0]][settingElements[1]] = {};
					if( typeof($localStorage[settingElements[0]][settingElements[1]][settingElements[2]]) === 'undefined' )
						$localStorage[settingElements[0]][settingElements[1]][settingElements[2]] = {};
						
					oldValue = $localStorage[settingElements[0]][settingElements[1]][settingElements[2]][settingElements[3]];
					$localStorage[settingElements[0]][settingElements[1]][settingElements[2]][settingElements[3]] = value;
					break;
			}
		},
		
		
		/**
		 * Get a setting
		 * @param setting = string (the setting to fetch)
		 **/
		getSetting: function( setting ){			
			settingElements = setting.split('.');
			switch( settingElements.length ){
				case 1:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' ) return null;
					return $localStorage[settingElements[0]];
					break;
				case 2:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' )
						return null;
					if( typeof($localStorage[settingElements[0]][settingElements[1]]) === 'undefined' )
						return null;
					return $localStorage[settingElements[0]][settingElements[1]];
					break;
				case 3:
					if( typeof($localStorage[settingElements[0]]) === 'undefined' )
						return null;
					if( typeof($localStorage[settingElements[0]][settingElements[1]][settingElements[2]]) === 'undefined' )
						return null;
					return $localStorage[settingElements[0]][settingElements[1]][settingElements[2]];
					break;
			}
		},
		
		getSettings: function(){
			return $localStorage;
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
			service.setSetting('emulateTouchDevice',false);
			service.setSetting('pointerMode','default');
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
	var mopidyhost = service.getSetting("mopidy.host");
	if( !mopidyhost ) mopidyhost = window.location.hostname;
	var mopidyport = service.getSetting("mopidy.port");
	if( !mopidyport ) mopidyport = "6680";
	
	var urlBase = 'http://'+ mopidyhost +':'+ mopidyport +'/spotmop/';
	
	return service;	
}]);






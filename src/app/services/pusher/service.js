'use strict';

angular.module('spotmop.services.pusher', [
])

.factory("PusherService", function($rootScope, $http, $q, $localStorage, $cacheFactory, SettingsService, NotifyService){

	// make sure we have a local storage container
	if( typeof( $localStorage.pusher ) === 'undefined' )
		$localStorage.pusher = {};
		
	// build the endpoint string
	var urlBase = 'http://'+ SettingsService.getSetting('mopidyhost', window.location.hostname);
	urlBase += ':'+ SettingsService.getSetting('mopidyport', '6680');
	urlBase += '/spotmop/';
    
	var service = {
		pusher: {},
		
		isConnected: false,
		
		start: function(){
            var self = this;

            // Get mopidy ip and port from settigns
            var pusherhost = SettingsService.getSetting("mopidyhost", window.location.hostname);
            var pusherport = SettingsService.getSetting("pusherport", "6681");
			
            try{
				var host = 'ws://'+pusherhost+':'+pusherport+'/pusher';
				var pusher = new WebSocket(host);

				pusher.onopen = function(){
					$rootScope.$broadcast('spotmop:pusher:online');
					this.isConnected = true;
				}

				pusher.onmessage = function( response ){
                    
					var data = JSON.parse(response.data);
					
					// if this is a pusher message (because Mopidy uses websockets too!)
					if( data.pusher ){
					
                        // if it's an initial connection status message, just parse it through quietly
                        if( data.startup ){
                            console.info('Pusher connected as '+data.details.id);
                            SettingsService.setSetting('pusherid', data.details.id);
                            SettingsService.setSetting('pusherip', data.details.ip);
                            
                            // detect if the core has been updated
                            if( SettingsService.getSetting('spotmopversion', 0) != data.version ){
                                NotifyService.notify('New version detected, clearing caches...');      
                                $cacheFactory.get('$http').removeAll();                        
                                SettingsService.setSetting('spotmopversion', data.version);
                            }
							
                            // notify server of our actual username
                            var name = SettingsService.getSetting('pushername', null)
                            if( name )
                                service.setMe( name );
                        
                        // standard notification, fire it out!
                        }else{
                            // make sure we're not notifying ourselves
                            if( data.id != SettingsService.getSetting('pusherid', null) && !SettingsService.getSetting('pusherdisabled', false) )
                                $rootScope.$broadcast('spotmop:pusher:received', data);
                        }
					}
				}

				pusher.onclose = function(){
					$rootScope.$broadcast('spotmop:pusher:offline');
					service.isConnected = false;
                    setTimeout(function(){ service.start() }, 5000);
				}
				
				service.pusher = pusher;
            }catch(e){
                // need to re-initiate notifier
				console.log( "Connecting with Pusher failed with the following error message: " + e);
            }
		},
		
		stop: function() {
			this.pusher = null;
			this.isConnected = false;
		},
		
		send: function( data ){
			data.pusher = true;
			data.id = SettingsService.getSetting('pusherid',null);
			service.pusher.send( JSON.stringify(data) );
		},
        
        /**
         * Notify the Pusher service of our name
         * @param name (string)
         * @return deferred promise
         **/
        setMe: function( name ){
            var id = SettingsService.getSetting('pusherid', null);
            $.ajax({
                method: 'GET',
                cache: false,
                url: urlBase+'pusher/me?id='+id+'&name='+name
            });
        },
        
        /**
         * Get a list of all active connections
         **/
        getConnections: function(){
            var deferred = $q.defer();
            $http({
                    method: 'GET',
                    cache: false,
                    url: urlBase+'pusher/connections'
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
    
    return service;
});

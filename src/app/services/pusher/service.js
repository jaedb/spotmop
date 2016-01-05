'use strict';

angular.module('spotmop.services.pusher', [
])

.factory("PusherService", function($rootScope, $http, $q, $localStorage, SettingsService){

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
			
				console.info('Pusher connected');

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
                            SettingsService.setSetting('pusherid', data.details.id);
                            SettingsService.setSetting('pusherip', data.details.ip);
                            
                            // notify server of our actual username
                            var name = SettingsService.getSetting('pushername', null)
                            if( name )
                                service.setMe( name );
                        
                        // standard notification, fire it out!
                        }else{
							$rootScope.$broadcast('spotmop:pusher:received', data);
                        }
					}
				}

				pusher.onclose = function(){
					$rootScope.$broadcast('spotmop:pusher:offline');
					service.isConnected = false;
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
            console.log( data );
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
        }
	};
    
    return service;
});

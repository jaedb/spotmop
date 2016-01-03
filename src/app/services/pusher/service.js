'use strict';

angular.module('spotmop.services.pusher', [
])

.factory("PusherService", function($rootScope, SettingsService){

	return {
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
					
					// if this is a pusher message, and it didn't originate from me
					if( data.pusher ){
						if( data.clientip != SettingsService.getSetting('client', {ip:null,name:null}).ip ){
							$rootScope.$broadcast('spotmop:pusher:received', data);
						}
					}
				}

				pusher.onclose = function(){
					$rootScope.$broadcast('spotmop:pusher:offline');
					this.isConnected = false;
				}
				
				this.pusher = pusher;
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
			data.clientip = SettingsService.getSetting('client',{ip:null,name:null}).ip;
			this.pusher.send( JSON.stringify(data) );
            console.log( data );
		}
	};
});

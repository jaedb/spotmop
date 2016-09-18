'use strict';

angular.module('spotmop.services.pusher', [
])

.factory("PusherService", function($rootScope, $http, $q, $localStorage, $cacheFactory, $templateCache, SettingsService, NotifyService){

	// make sure we have a local storage container
	if( typeof( $localStorage.pusher ) === 'undefined' )
		$localStorage.pusher = {};
		
	// build the endpoint string
	var mopidyhost = SettingsService.getSetting("mopidy.host");
	if( !mopidyhost ) mopidyhost = window.location.hostname;
	var mopidyport = SettingsService.getSetting("mopidy.port");
	if( !mopidyport ) mopidyport = "6680";
	
	var urlBase = '//'+ mopidyhost +':'+ mopidyport +'/spotmop/';
    
	// generate a complex unique id
	function generateMessageID(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
	
	var deferredRequests = [];

	function resolveRequest(requestId, message ){
		var response = JSON.parse( message );
		deferredRequests[request_id].resolve( response );
		delete deferredRequests[request_id];
	}

	function rejectRequest(requestId, message) {
		deferredRequests[requestId].reject( message );
	}
	
	var state = {
		isConnected: false,
        connections: []
    }
    
	var service = {
        
        state: function(){
            return state;
        },
		pusher: {},
		
		start: function(){
            var self = this;

            // Get mopidy/pusher ip and port from settigns
			var pusherhost = SettingsService.getSetting("mopidy.host");
			if( !pusherhost ) pusherhost = window.location.hostname;
			var pusherport = SettingsService.getSetting("pusher.port");
			if( !pusherport ) pusherport = "6681";
			var protocol = 'ws';
			if( window.location.protocol != "http:" ) protocol = 'wss'; 
			
            try{
				var host = protocol+'://'+pusherhost+':'+pusherport+'/pusher'; 
                
                var connectionid = Math.random().toString(36).substr(2, 9);
                SettingsService.setSetting('pusher.connectionid', connectionid);
				
				var clientid = SettingsService.getSetting('pusher.clientid');
				if( !clientid ){
					clientid = Math.random().toString(36).substr(2, 9);
					SettingsService.setSetting('pusher.clientid', clientid);
				}
				
				var username = SettingsService.getSetting('pusher.username');
				if( !username ){
					username = Math.random().toString(36).substr(2, 9);
					SettingsService.setSetting('pusher.username', username);
				}
                username = encodeURI(username);
				
				var pusher = new WebSocket(host, [ clientid, connectionid, username ] );

				pusher.onopen = function(){
					$rootScope.$broadcast('spotmop:pusher:online');
					state.isConnected = true;
                    service.updateConnections();
				}

				pusher.onmessage = function( response ){
                    
					var message = JSON.parse(response.data);
					console.log(message);
					
					if( message.type == 'response' ){
						
						if( typeof( deferredRequests[ message.message_id ] ) !== 'undefined' ){
							deferredRequests[ message.message_id ].resolve( message );
						}else{
							console.error('Incoming response missing a matching request');
						}
						
					}else if( message.type == 'broadcast'){
                    
						$rootScope.$broadcast('spotmop:pusher:'+message.action, message);
						
						switch( message.action ){
						
							// initial connection status message, just parse it through quietly
							case 'client_connected':
                                
                                service.updateConnections();
                                
								// if the new connection is mine
								if( message.data.connectionid == SettingsService.getSetting('pusher.connectionid') ){
									console.info('Pusher connection '+message.data.connectionid+' accepted');
									
									// detect if the core has been updated
									if( message.data.version != SettingsService.getSetting('version.installed') ){
										NotifyService.notify('New version detected, clearing caches...');      
										$cacheFactory.get('$http').removeAll();
										$templateCache.removeAll();
										SettingsService.setSetting('version.installed', message.data.version);
										SettingsService.postUpgrade();
									}
								}							
								break;
						
							case 'client_disconnected':                                
                                service.updateConnections();
                                break;
						
							case 'connection_updated':                                
                                service.updateConnections();
                                break;
							
							case 'notification':
								var title = '';
								var body = '';
								var icon = '';
								if( typeof(message.data.title) !== 'undefined' ) title = message.data.title;
								if( typeof(message.data.body) !== 'undefined' ) body = message.data.body;
								if( typeof(message.data.icon) !== 'undefined' ) icon = message.data.icon;
								NotifyService.browserNotify( title, body, icon );
								break;
								
							case 'soft_notification':
								NotifyService.notify( message.data.body );
								break;
								
							case 'upgraded':
								NotifyService.notify( 'Mopidy has been upgraded to '+message.data.version );
								break;
							
							case 'enforced_refresh':
								location.reload();
								NotifyService.notify('System updating...');      
								$cacheFactory.get('$http').removeAll();
								$templateCache.removeAll();
								break;
						}
					}
				}

				pusher.onclose = function(){
					$rootScope.$broadcast('spotmop:pusher:offline');
					state.isConnected = false;
                    setTimeout(function(){ service.start() }, 5000);
				}
				
				service.pusher = pusher;
            }catch(e){
                // need to re-initiate notifier
				console.log( "Connecting with Pusher failed with the following error message: " + e);
            }
		},
		
		stop: function() {
			service.pusher = null;
			state.isConnected = false;
			$rootScope.pusherOnline = false;
		},
		
		// Point-and-shoot, one-way broadcast
		broadcast: function( data ){
			
			// Set type
			data.type = 'broadcast';
			
			// Send off the payload
			// We do not expect a response, so no loitering buddy...
			service.pusher.send( JSON.stringify(data) );
		},
		
		// A query that we require a response from the server for
		// We create a unique ID to map responses with our deferred requests' ID
		query: function( data ){
			return $q(function(resolve, reject){
				
				// set type
				data.type = 'query';
				
				// construct a unique id
				data.message_id = generateMessageID();
				
				// send the payload
				service.pusher.send( JSON.stringify(data) );
				
				// add query to our deferred responses
				deferredRequests[ data.message_id ] = {
					resolve: resolve,
					reject: reject
				};
			});
		},
        
        /**
         * Get a list of all active connections
         **/
        updateConnections: function(){
			service.query({ action: 'get_connections' })
                .then( function(response){
                    state.connections = response.data.connections;
                });
        }
	};
    
    return service;
});

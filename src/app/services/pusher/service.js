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
	
	var urlBase = 'http://'+ mopidyhost +':'+ mopidyport +'/spotmop/';
    
	var service = {
		pusher: {},
		
		isConnected: false,
		
		start: function(){
            var self = this;

            // Get mopidy/pusher ip and port from settigns
			var pusherhost = SettingsService.getSetting("mopidy.host");
			if( !pusherhost ) pusherhost = window.location.hostname;
			var pusherport = SettingsService.getSetting("pusher.port");
			if( !pusherport ) pusherport = "6681";
			
            try{
				var host = 'ws://'+pusherhost+':'+pusherport+'/pusher';
                
                var id = Math.random().toString(36).substr(2, 9);
                SettingsService.setSetting('pusher.id', id);
                var name = "User";
                if( SettingsService.getSetting('pusher.name') ) name = encodeURI(SettingsService.getSetting('pusher.name'));
                
				var pusher = new WebSocket(host, id+'_'+name );

				pusher.onopen = function(){
					$rootScope.$broadcast('spotmop:pusher:online');
					this.isConnected = true;
				}

				pusher.onmessage = function( response ){
                    
					var message = JSON.parse(response.data);
					console.log(message);
                    
                    $rootScope.$broadcast('spotmop:pusher:'+message.type, message.data);
                    
					switch( message.type ){
					
						// initial connection status message, just parse it through quietly
						case 'client_connected':
						
							// if the new connection is mine
							if( message.data.id == SettingsService.getSetting('pusher.id') ){
								console.info('Pusher connection '+message.data.id+' accepted');
								
								// detect if the core has been updated
								if( message.data.version != SettingsService.getSetting('version.installed') ){
									NotifyService.notify('New version detected, clearing caches...');      
									$cacheFactory.get('$http').removeAll();
									$templateCache.removeAll();
									SettingsService.setSetting('version.installed', message.data.version);
									SettingsService.runUpgrade();
								}
							}							
							break;
						
						case 'notification':
							
							// respect notifications disabled setting
							if( !SettingsService.getSetting('pusher.disabled') ){
                                var title = '';
                                var body = '';
                                var icon = '';
                                if( typeof(message.data.title) !== 'undefined' ) title = message.data.title;
                                if( typeof(message.data.body) !== 'undefined' ) body = message.data.body;
                                if( typeof(message.data.icon) !== 'undefined' ) icon = message.data.icon;
								NotifyService.browserNotify( title, body, icon );
							}
							break;
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
			
			// make sure we have a recipients array, even if empty
			if( typeof(data.recipients) === 'undefined' ) data.recipients = [];
            
            // set the origin of this notification as the current client/connection
			var name = SettingsService.getSetting('pusher.name');
			if( !name ) name = 'User';			
			data.origin = {
				ip: SettingsService.getSetting('pusher.ip'),
				id: SettingsService.getSetting('pusher.id'),
				name: name
			};
            
            // send off the notification to the websocket
			service.pusher.send( JSON.stringify(data) );
		},
        
        /**
         * Notify the Pusher service of our name
         * @param name (string)
         * @return deferred promise
         **/
        setMe: function( name ){
            var id = SettingsService.getSetting('pusher.id');
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

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
                    
                    /*
					switch( data.type ){
					
						// initial connection status message, just parse it through quietly
						case 'startup':
						
							console.info('Pusher connected as '+data.client.id);
							SettingsService.setSetting('pusher.id', data.client.id);
							SettingsService.setSetting('pusher.ip', data.client.ip);
                            $rootScope.$broadcast('spotmop:pusher:setup');
								
							// detect if the core has been updated
							if( SettingsService.getSetting('version.installed') != data.version ){
								NotifyService.notify('New version detected, clearing caches...');      
								$cacheFactory.get('$http').removeAll();
								$templateCache.removeAll();
								SettingsService.setSetting('version.installed', data.version);
								SettingsService.runUpgrade();
							}
							
							// notify server of our actual username
							var name = SettingsService.getSetting('pusher.name')
							if( name ) service.setMe( name );
							break;
						
						case 'notification':
							
							// respect notifications disabled setting
							if( !SettingsService.getSetting('pusher.disabled') ){
								NotifyService.browserNotify( data.title, data.body, data.client.icon );
							}
							break;
						
						case 'connections_changed':
							$rootScope.$broadcast('spotmop:pusher:connections_changed', data);
							break;
					}
                    */
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
			
			var icon = '';
			var spotifyuser = SettingsService.getSetting('spotifyuser');  
			if( spotifyuser ){
				icon = spotifyuser.images[0].url;
			}
		
			var name = SettingsService.getSetting('pusher.name');
			if( !name ) name = 'User';
			
			data.client = {
				ip: SettingsService.getSetting('pusher.ip'),
				id: SettingsService.getSetting('pusher.id'),
				name: name,
				icon: icon
			};
			
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

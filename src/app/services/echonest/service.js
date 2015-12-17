/**
 * Create an Echonest service
 *
 * This holds all of the Echonest API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.echonest', [])

.factory("EchonestService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', '$cacheFactory', '$q', 'SettingsService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, $cacheFactory, $q, SettingsService ){
    
    var baseURL = 'http://developer.echonest.com/api/v4/';
    var apiKey = SettingsService.getSetting('echonestapikey','YVW64VSEPEV93M4EG');
    var profileID = SettingsService.getSetting('echonesttasteprofileid',false);
	
	// setup response object
    return {
        
        isOnline: false,
        
        start: function(){
            
            SettingsService.setSetting('echonestenabled',true);
            
            // if we don't have a taste profile, make one
            if( !SettingsService.getSetting('echonesttasteprofileid',false) ){
                this.createTasteProfile()
                    .then( function(response){ 
                        SettingsService.setSetting('echonesttasteprofileid', response.response.id);
                        this.isOnline = true;
                        $rootScope.echonestOnline = true;
                    });
            }else{
                this.getTasteProfile( SettingsService.getSetting('echonesttasteprofileid',false) )
                    .then( function(response){
                        this.isOnline = true;
                        $rootScope.echonestOnline = true;
                        $localStorage.echonesttasteprofile = response.response.catalog;
                    });
            }
        },
        
        stop: function(){            
            SettingsService.setSetting('echonestenabled',false);            
            $rootScope.echonestOnline = false;
        },
        
        /**
         * Taste Profile
         **/
		createTasteProfile: function(){
		
            var deferred = $q.defer();

            $http({
					cache: false,
					method: 'POST',
					url: baseURL+'catalog/create',
					data: {
							api_key: apiKey,
							format: 'json',
							type: 'general',
							name: 'spotmop:' + Date.now() + Math.round((Math.random() + 1) * 1000),
						}
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					this.isOnline = false;
					$rootScope.echonestOnline = false;
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'createTasteProfile', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
		getTasteProfile: function(){
		
            var deferred = $q.defer();

            $http({
					cache: false,
					method: 'GET',
					url: baseURL+'tasteprofile/read?api_key='+apiKey+'&id='+profileID
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					this.isOnline = false;
					$rootScope.echonestOnline = false;
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getTasteProfile', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
        
		
		/**
		 * Add a number of trackids to the taste profile
		 * NOTE: This hasn't been upgraded to return a deferred.promise because of CORS issue when using $http instead of $ajax ... need to investigate
		 * @param action = string the action that we need to add ("delete"|"update"|"play"|"skip")
		 * @param trackid = string|array spotify uri
		 * @param favorite = boolean (optional) add these track(s) as favorites
		 * @return ajax request
		 **/
		addToTasteProfile: function( action, trackid ){
			
			var requestData = [];
			var trackids = [];
			
			// if we've been given a single string, wrap it in an array
			if( typeof( trackid ) === 'string' ){
				trackids = [trackid];
			}else{
				trackids = trackid;
			}
			
			// loop all the trackids (even if a single one, wrapped in an array)
			angular.forEach( trackids, function( trackid ){
			
				// add each to our request payload
				requestData.push( {
								action: action,
								item: {
									track_id: trackid
								}
							} );
			});
		
            return $.ajax({
                url: baseURL+'tasteprofile/update',
                method: "POST",
				data: {
						api_key: apiKey,
						format: 'json',
						data_type: 'json',
						id: profileID,
						data: JSON.stringify( requestData )
					}
            });
        },
        
        
        /**
         * Get artist
         **/
		getArtistBiography: function( artistid ){
		
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: baseURL+'artist/biographies?api_key='+apiKey+'&format=json&results=1&id='+artistid
				})
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'getArtistBiography', message: response.error.message});
                    deferred.reject( response.error.message );
                });
				
            return deferred.promise;
        },
		
        
        /**
         * Recommended content
		 * We disable caching on these calls because a single track play will alter the recommendations returned
         **/
		 
		/**
		 * Recommend artists based on another artist (or on our taste profile)
		 * @param artistname = array of artist objects (optional)
		 * @return promise
		 **/
		recommendedArtists: function( artists ){
			
			// no artist provided, so seed based on our taste profile
			if( typeof( artists ) === 'undefined' || !artists || artists.length <= 0 ){				
				var seed = '&seed_catalog='+profileID;
				
			// the artist name
			}else{
				var seed = '';				
				angular.forEach( artists, function(artist){
					seed += '&name='+artist.name_encoded;
				});
			}
			
            var deferred = $q.defer();

            $http.get(baseURL+'artist/similar?api_key='+apiKey+seed+'&format=json&bucket=id:spotify&results=10')
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'catalogRadio', message: response.error.message});
                    deferred.reject("Failed to get albums");
                });
				
            return deferred.promise;
        },
		
		favoriteArtists: function(){		
		
            var deferred = $q.defer();

            $http.get(baseURL+'playlist/static?api_key='+apiKey+'&type=catalog&seed_catalog='+profileID+'&bucket=id:spotify&format=json&results=20&adventurousness=0')
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'favoriteArtists', message: response.error.message});
                    deferred.reject("Failed to get albums");
                });
				
            return deferred.promise;
        },
		
		catalogRadio: function(){		
		
            var deferred = $q.defer();

            $http.get(baseURL+'playlist/static?api_key='+apiKey+'&type=catalog-radio&seed_catalog='+profileID+'&bucket=artist_discovery&bucket=id:spotify&format=json&results=20')
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'catalogRadio', message: response.error.message});
                    deferred.reject("Failed to get albums");
                });
				
            return deferred.promise;
        },
		
		startArtistRadio: function( artistname ){
		
            var deferred = $q.defer();
			
            $http.get(baseURL+'playlist/dynamic/create?api_key='+apiKey+'&type=artist-radio&artist='+artistname+'&bucket=tracks&bucket=id:spotify&results=1')
                .success(function( response ){
                    deferred.resolve( response );
                })
                .error(function( response ){
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'artistRadio', message: response.error.message});
                    deferred.reject("Failed to create artist radio");
                });
				
            return deferred.promise;
        }
	};
}]);






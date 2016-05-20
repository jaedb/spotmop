/**
 * Create a LastFM service 
 *
 * This holds all of the LastFM API calls, and returns the response (or promise)
 * back to the caller.
 * @return dataFactory array
 **/
 
angular.module('spotmop.services.lastfm', [])

.factory("LastfmService", ['$rootScope', '$resource', '$localStorage', '$http', '$interval', '$timeout', '$filter', '$q', 'SettingsService', 'NotifyService', function( $rootScope, $resource, $localStorage, $http, $interval, $timeout, $filter, $q, SettingsService, NotifyService ){
	
	// setup response object
    var service = {
		
		/**
		 * Perform an API lookup
		 * @param params = string (url params)
		 * @return promise
		 **/
		sendRequest: function( params ){
            var deferred = $q.defer();

            $http({
					cache: true,
					method: 'GET',
					url: urlBase+'?format=json&api_key='+apiKey+'&'+params
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

		trackInfo: function( artist, track ){
			return this.sendRequest('method=track.getInfo&track='+track+'&artist='+artist);
		},

		albumInfo: function( artist, album ){
			return this.sendRequest('method=album.getInfo&album='+album+'&artist='+artist);
		},
		albumInfoByMbid: function( mbid ){
			return this.sendRequest('method=album.getInfo&mbid='+mbid);
		},

		artistInfo: function( artist ){
			return this.sendRequest('method=artist.getInfo&artist='+artist);
		},
		artistInfoByMbid: function( mbid ){
			return this.sendRequest('method=artist.getInfo&mbid='+mbid);
		}
	};
	
	// specify the base URL for the API endpoints
    var urlBase = 'http://ws.audioscrobbler.com/2.0';
	var apiKey = SettingsService.getSetting("lastfmkey", '4320a3ef51c9b3d69de552ac083c55e3');
	
	// and finally, give us our service!
	return service;
}]);










'use strict';

angular.module('spotmop.common.tracklist.service', [])

.factory("TracklistService", function( $rootScope ){
	
	return {
		getSelectedTracks: function(){
			console.log('triggered getSelectedTracks');
		}
	}	
});




'use strict';

angular.module('spotmop.music.tracklist', [])

.controller('TracklistController', function TracklistController( $scope ){
	
	$scope.trackClicked = function( obj, $event ){
		//$($event.target).toggleClass('highlighted');
	}
	
});
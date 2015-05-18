'use strict';

angular.module('spotmop.browse.tracklist', [])

.controller('TracklistController', function TracklistController( $scope ){
	
	$scope.trackClicked = function( obj, $event ){
		//$($event.target).toggleClass('highlighted');
	}
	
});
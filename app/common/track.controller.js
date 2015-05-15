'use strict';

angular.module('spotmop.track', [])

.controller('TrackController', function PlaylistController( $scope ){
	
	$scope.class = '';
	
	$scope.trackClicked = function( obj, $event ){
		if( $scope.class == 'highlighted' )
			$scope.class = '';
		else
			$scope.class = 'highlighted';
	}
	
});
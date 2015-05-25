
angular.module('spotmop.queue', [
    'ngRoute'
])

/**
 * Every controller start with defining its own routes.
 */
.config(function($routeProvider) {
    $routeProvider.when("/queue", {
        templateUrl: "app/queue/template.html",
        controller: "QueueController"
    });
})
	
.controller('QueueController', function QueueController( $scope, $rootScope, $route, $timeout, MopidyService ){
	
	$scope.totalTime = 0;
	$scope.currentTlTrack = {};
	
	$scope.$on('spotmop:currentTrackChanged', function( event, tlTrack ){
		updateCurrentTlTrack( tlTrack );
	});
	
	
	/**
	 * Get new currently playing tl track
	 * TODO: Apply this to the directive that handles the currentlyPlaying switch
	 * @param tlTrack = obj (optional)
	 **/
	function updateCurrentTlTrack( tlTrack ){
	
		// we've been parsed a tlTrack, so just save it
		if( typeof( tlTrack ) !== 'undefined' ){
			$scope.currentTlTrack = tlTrack;
		
		// not provided, let's get it ourselves
		}else{
			MopidyService.getCurrentTlTrack()
				.then(
					function( tlTrack ){
						$scope.currentTlTrack = tlTrack;
					}
				);
		}
	}
	
	// get tracklist on load
	// TODO: need to figure out how to do this, without upsetting $digest
	//$timeout(fetchTracklist, 1000);
	
	/**
	 * Fetch the tracklist
	 **/
	function fetchTracklist(){		
		MopidyService.getCurrentTlTracks().then( function( tracks ){			
			updateTracklist( tracks );
		});
		updateCurrentTlTrack();
	};
	
	/**
	 * Update our tracklist
	 **/
	function updateTracklist( tracks ){
		
		$scope.currentTracklist = tracks;
		
		// figure out the total time for all tracks
		var totalTime = 0;
		$.each( $scope.currentTracklist, function( key, track ){
			totalTime += track.track.length;
		});	
		$scope.totalTime = Math.round(totalTime / 100000);
	};
});
angular.module('spotmop.queue', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('queue', {
			url: "/queue",
			templateUrl: "app/queue/template.html",
			controller: 'QueueController'
		});
})
	
/**
 * Main controller
 **/
.controller('QueueController', function QueueController( $scope, $rootScope, $filter, $timeout, $state, MopidyService, SpotifyService ){
	
	$scope.totalTime = 0;
	$scope.tracklist = { type: 'tltrack', tracks: $rootScope.currentTracklist };

    /**
     * Watch the current tracklist
     * And update our totalTime when the tracklist changes
     **/
    $rootScope.$watch(
        function( $rootScope ){
            return $rootScope.currentTracklist;
        },
        function(newTracklist, oldTracklist){
			$scope.tracklist.tracks = newTracklist;
			calculateTotalTime( newTracklist );
        }
    );
	
    
	/**
	 * Add all the ms lengths of the tracklist, and convert to total play time in minutes
	 **/
	function calculateTotalTime( tracklist ){
		
		// figure out the total time for all tracks
		var totalTime = 0;
		$.each( tracklist, function( key, track ){
			totalTime += track.track.length;
		});	
		$scope.totalTime = Math.round(totalTime / 100000);
	};
	
	
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		var tracksToDelete = [];
		
		// build an array of tlids to remove
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( selectedTrack.tlid );
		});
		
		// remove tracks from DOM (for snappier UX)
		// we also need to wrap this in a forced digest process to refresh the tracklist template immediately
		$scope.$apply( function(){
			$scope.tracklist.tracks = $filter('filter')( $scope.tracklist.tracks, { selected: false } );
		});
		
		MopidyService.removeFromTrackList( tracksToDelete );
	});
	
});
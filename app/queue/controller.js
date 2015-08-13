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
	$scope.tracklist = { tracks: $scope.$parent.currentTracklist };

    /**
     * Watch the current tracklist
     * And update our totalTime when the tracklist changes
     **/
    $scope.$watch(
        function( $scope ){
            return $scope.$parent.currentTracklist;
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
		
		MopidyService.removeFromTrackList( tracksToDelete );
	});
	
	
	/**
	 * When the enter key is broadcast, play the first of our currently selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:enter', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		
		// make sure we have at least one track selected
		if( selectedTracks.length > 0 ){
		
			// fetch our tracklist
			// TODO: figure out why we need to re-fetch the tracklist all the time, rather than storing in a variable
			MopidyService.getCurrentTlTracks().then( function(tltracks){
			
				// loop our tracklist
				angular.forEach( tltracks, function(tltrack){
				
					// this tlid matches our first selected track's tlid (aka the same track)
					if( tltrack.tlid === selectedTracks[0].tlid ){
						return MopidyService.playTlTrack({ tl_track: tltrack });
					}
				});
			});
		}
	});
	
});
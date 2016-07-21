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
.controller('QueueController', function QueueController( $scope, $rootScope, $filter, $timeout, $state, MopidyService, SpotifyService, DialogService ){
	
	$scope.totalTime = 0;
	$scope.tracks = $rootScope.currentTracklist;
    $scope.limit = 50;
    
	// once we're told we're ready to show more tracks
    var loadingMoreTracks = false;
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && $scope.tracks.length >= $scope.limit ){
            
            $scope.limit += 50;
            loadingMoreTracks = true;
            
            // apply a timeout so we don't load all of the extra tracks in one digest
            $timeout(
                    function(){
                        loadingMoreTracks = false;
                    },
                    100
                );
        }
	});

	$scope.addUri = function(){
		DialogService.create('addbyuri',$scope);
	};

	$scope.clearQueue = function(){
		MopidyService.clearCurrentTrackList();
	};
	
	
    /**
     * Watch the current tracklist
     * And update our totalTime when the tracklist changes
     **/
    $rootScope.$watch(
        function( $rootScope ){
            return $rootScope.currentTracklist;
        },
        function(newTracklist, oldTracklist){
			$scope.tracks = newTracklist;
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
		
		var selectedTracks = $filter('filter')( $scope.tracks, { selected: true } );
		var tracksToDelete = [];
		
		// build an array of tlids to remove
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( selectedTrack.tlid );
		});
		
		// remove tracks from DOM (for snappier UX)
		// we also need to wrap this in a forced digest process to refresh the tracklist template immediately
		$scope.$apply( function(){
			$scope.tracks = $filter('filter')( $scope.tracks, { selected: false } );
		});
		
		MopidyService.removeFromTrackList( tracksToDelete );
	});
	
});
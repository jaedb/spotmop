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
.controller('QueueController', function QueueController( $scope, $rootScope, $filter, $timeout, $state, MopidyService, SpotifyService, DialogService, PlayerService ){
	
	$scope.player = PlayerService.state();
    $scope.limit = 50;
	$scope.totalTime = function(){
		var totalTime = 0;
		$.each( $scope.player.currentTracklist, function( key, track ){
			totalTime += track.length;
		});	
		return Math.round(totalTime / 100000);
	};
    
	// once we're told we're ready to show more tracks
    /*
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
	});*/

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
     /*
    $scope.$watch(
        'player.currentTracklist',
        function(newTracklist, oldTracklist){
			$scope.tracks = newTracklist;
        }
    );*/
	
	
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.player.currentTracklist, { selected: true } );
		var tracksToDelete = [];
		
		// build an array of tlids to remove
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( selectedTrack.tlid );
		});
		
		// remove tracks from DOM (for snappier UX)
		// we also need to wrap this in a forced digest process to refresh the tracklist template immediately
		$scope.$apply( function(){
			$scope.player.currentTracklist = $filter('filter')( $scope.player.currentTracklist, { selected: false } );
		});
		
		MopidyService.removeFromTrackList( tracksToDelete );
	});
	
});
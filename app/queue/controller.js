
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
	
.controller('QueueController', function QueueController( $scope, $rootScope, $timeout, MopidyService ){
	
	$scope.tracks = [];
	$scope.totalTime = 0;
	$scope.currentTlTrack = {};
	
	$scope.$on('spotmop:tracklistUpdated', function(event, tracks){
		updateTracklist( tracks );
	});
	
	$scope.$on('spotmop:currentTrackChanged', function(){
		updateCurrentTlTrack();
	});
	
	/**
	 * Get new currently playing tl track
	 * TODO: Apply this to the directive that handles the currentlyPlaying switch
	 **/
	function updateCurrentTlTrack(){
		MopidyService.getCurrentTrackListTrack()
			.then(
				function( currentTlTrack ){
					$scope.currentTlTrack = currentTlTrack;
					highlightCurrentTrack();
				}
			);
	}
	
	// get tracklist on load
	// TODO: need to figure out how to do this, without upsetting $digest
	$timeout(fetchTracklist, 1000);
	
	/*
	$scope.$on('mopidy:event:tracklistChanged', function(){
		updateTracklist();
	});
	*/
	
	/**
	 * Fetch the tracklist
	 **/
	function fetchTracklist(){		
		MopidyService.getCurrentTrackListTracks().then( function(tracks){			
			updateTracklist( tracks );
		});
		updateCurrentTlTrack();
	};
	
	/**
	 * Update our tracklist
	 **/
	function updateTracklist( tracks ){
		
		$scope.tracks = tracks;
		
		// figure out the total time for all tracks
		var totalTime = 0;
		$.each( $scope.tracks, function( key, track ){
			totalTime += track.track.length;
		});	
		$scope.totalTime = Math.round(totalTime / 100000);	
		
		highlightCurrentTrack();
	};
	
	/**
	 * Highlight the currently playing TlTrack
	 **/
	function highlightCurrentTrack(){
		
		/*
		// search each of the tracks for the tlid
		$.each( $scope.tracks, function(key, track){
		
			// if we have a match, mark it as currently playing
			if( $scope.currentTlTrack && track.tlid === $scope.currentTlTrack.tlid ){
				track.currentlyPlaying = true;
			}else{
				track.currentlyPlaying = false;
			}
		});
		*/
	}
});
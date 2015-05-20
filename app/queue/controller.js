
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
	$scope.currentTlTrack;
	
	$scope.$on('spotmop:tracklistUpdated', function(event, tracks){
		updateTracklist( tracks );
	});
	
	$scope.$on('mopidy:event:trackPlaybackStarted', function(event, tracks){
		highlightCurrentTrack();
	});
	
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
	};
	
	/**
	 * Update our tracklist
	 **/
	function updateTracklist( tracks ){
		
		$scope.tracks = tracks;
		console.log( $scope.tracks );
		// figure out the total time for all tracks
		var totalTime = 0;
		$.each( $scope.tracks, function( key, track ){
			totalTime += track.track.length;
		});	
		$scope.totalTime = Math.round(totalTime / 100000);	
	
		// TODO: map the current track with the tracklist, so we can highlight the currently playing track
		MopidyService.getCurrentTrackListTrack().then( function(currentTlTrack){
			$scope.currentTlTrack = currentTlTrack;
			highlightCurrentTrack();
		});
	};
	
	/**
	 * Highlight the currently playing TlTrack
	 **/
	function highlightCurrentTrack(){
	
		// search each of the tracks for the tlid
		$.each( $scope.tracks, function(key, track){
		
			// if we have a match, mark it as currently playing
			if( track.tlid === $scope.currentTlTrack.tlid ){
				track.currentlyPlaying = true;
			}
		});
	}
});
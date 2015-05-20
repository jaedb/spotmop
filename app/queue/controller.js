
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
		MopidyService.getCurrentTrackList().then( function(tracks){			
			updateTracklist( tracks );
		});
	};
	
	/**
	 * Update our tracklist
	 **/
	function updateTracklist( tracks ){
		
		$scope.tracks = tracks;
		
		// figure out the total time for all tracks
		var totalTime = 0;
		$.each( $scope.tracks, function( key, track ){
			totalTime += track.length;
		});	
		$scope.totalTime = Math.round(totalTime / 100000);	
	
		// TODO: map the current track with the tracklist, so we can highlight the currently playing track
		MopidyService.getCurrentTrackListTrack().then( function(currentTlTrack){
			$scope.currentTlTrack = currentTlTrack;
			console.log( currentTlTrack );
		});
		
	};
});
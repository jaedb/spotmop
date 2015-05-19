
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
	
.controller('QueueController', function QueueController( $scope, $timeout, MopidyService ){
	
	$scope.tracks = {};
	$scope.totalTime = 0;
	
	// get tracklist on load
	// TODO: need to figure out how to do this, without upsetting $digest
	$timeout(updateTracklist, 1000);
	
	$scope.$on('mopidy:event:tracklistChanged', function(){
		updateTracklist();
	});
	
	/**
	 * Fetch the tracklist
	 **/
	function updateTracklist(){
	
		MopidyService.getCurrentTrackList().then( function(tracks){
		
			// parse the tracklist to the template
			$scope.tracks = tracks;
			
			// figure out the total time for all tracks
			var totalTime = 0;
			$.each( $scope.tracks, function( key, track ){
				totalTime += track.length;
			});	
			$scope.totalTime = Math.round(totalTime / 100000);
		});
		
		
		
	};
});
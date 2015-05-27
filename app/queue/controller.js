
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

    /**
     * Watch the current tracklist
     * And update our totalTime when the tracklist changes
     **/
    $scope.$watch(
        function($scope){
            return $scope.$parent.currentTracklist;
        },
        function(newTracklist, oldTracklist){
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
});
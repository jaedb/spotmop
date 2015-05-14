
// build the main menu
app.controller('QueueController', ['$scope', 'MopidyService', function( $scope, MopidyService ){
	
	$scope.Tracklist = Mopidy.Tracklist;
	
	$scope.UpdateTracks = function(){
		//Mopidy.getTracklist();
		//console.log( Mopidy );
		MopidyService.getTracklist();
		console.log( 'updating tracks');
		//$scope.Tracks.push({ uri: 'Another' });
	};
	
}]);
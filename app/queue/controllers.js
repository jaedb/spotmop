
// build the main menu
app.controller('QueueController', ['$scope', 'Mopidy', function( $scope, Mopidy ){
	
	$scope.Tracklist = Mopidy.Tracklist;
	
	$scope.UpdateTracks = function(){
		//Mopidy.getTracklist();
		//console.log( Mopidy );
		Mopidy.getTracklist();
		console.log( 'updating tracks');
		//$scope.Tracks.push({ uri: 'Another' });
	};
	
}]);
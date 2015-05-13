
// build the main menu
app.controller('QueueController', function( $scope, Mopidy ){
	
	// set the default queue items
	$scope.items = [{uri: 'asdf'}];
	
	$scope.Tracks = function(){
		Mopidy.getTracklist;
	}
	
	console.log( Mopidy.Tracks );
	
});
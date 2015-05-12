
// build the main menu
app.controller('QueueController', function( $scope ){
	
	// set the default queue items
	$scope.items = [
		{
			Title: 'Track one',
			Link: 'queue'
		},
		{
			Title: 'Track two',
			Link: 'discover'
		}
	];
	
	$scope.UpdateQueue = function(){
		$scope.items.push({ Title: 'New one' });
	}
	
});
angular.module('spotmop.browse.featured', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.featured', {
			url: "/featured",
			templateUrl: "app/browse/featured/template.html",
			controller: 'FeaturedController'
		})
		.state('browse.featuredplaylist', {
			url: "/featured/:uri",
			templateUrl: "app/browse/playlist/template.html",
			controller: 'PlaylistController'
		});
})
	
/**
 * Main controller
 **/
.controller('FeaturedController', function FeaturedController( $scope, $rootScope, $filter, SpotifyService, NotifyService ){	
	
	// set the default items
	$scope.playlists = [];
	$scope.featured = function(){
		return $scope.playlists[0];
	}
	
	// figure out the most appropriate background image to show (based on current local time)
	$scope.partofday = function(){
	
		// convert to decimal (remembering that minutes are base-6)
		var hour = parseFloat($filter('date')(new Date(),'H.m'));
		
		if( hour >= 4 && hour < 9.3 )
			return 'commute';
		else if( hour >= 9.3 && hour < 11 )
			return 'morning';
		else if( hour >= 11 && hour < 13.5 )
			return 'midday';
		else if( hour >= 13.5 && hour < 17 )
			return 'afternoon';
		else if( hour >= 17 && hour < 19 )
			return 'evening';
		else if( hour >= 19 && hour < 21 )
			return 'dinner';
		else if( hour >= 21 && hour < 23 || hour >= 0 && hour < 4  )
			return 'late';
	};
	
	SpotifyService.featuredPlaylists()
		.then(function( response ) {
			$scope.message = response.message;
			$scope.playlists = response.playlists.items;
		});
});
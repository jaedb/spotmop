'use strict';

angular.module('spotmop.discover', [])

/**
 * Routing 
 **/
.config(function($stateProvider){
	
	$stateProvider
		.state('discover', {
			url: "/discover",
			templateUrl: "app/discover/template.html",
			controller: 'DiscoverController'
		});
})
	
/**
 * Main controller
 **/
.controller('DiscoverController', function DiscoverController( $scope, $rootScope, SpotifyService, EchonestService, SettingsService, NotifyService ){
	
	$scope.artists = [];
	$scope.playlists = [];
	$scope.albums = [];
	$scope.recommendations = {
		currentArtist: {
			artists: [],
			recommendations: []
		},
		suggestions: []
	};
	$scope.sections = [];
	
	
	SpotifyService.getMyFavorites('artists').then( function(response){
		console.log( response );
		$scope.sections.push({
			title: 'Some old favorites',
			items: response.items
		});
	});
	
	// get our recommended artists
	if( SettingsService.getSetting('echonest', false, 'enabled')){
		
			
		// ================= BASED ON CURRENT PLAYING ARTIST ==== //
		
		if( typeof($scope.state().currentTlTrack.track) !== 'undefined' ){
			var artists = [];
			angular.forEach( $scope.state().currentTlTrack.track.artists, function(artist){
				artists.push(
					{
						'name': artist.name,
						'name_encoded': encodeURIComponent(artist.name),
						'uri': artist.uri
					}
				);
			});
			$scope.recommendations.currentArtist.artists = artists;
		
			EchonestService.recommendedArtists( $scope.recommendations.currentArtist.artists )
				.then(function( response ){
				
					// convert our echonest list into an array to get from spotify
					var echonestArtists = response.response.artists;
					var artisturis = [];
					
					// make sure we got some artists
					if( echonestArtists.length <= 0 ){
					
						NotifyService.error( 'Your taste profile is empty. Play some more music!' );
						
					}else{
						
						angular.forEach( echonestArtists, function( echonestArtist ){
							if( typeof( echonestArtist.foreign_ids ) !== 'undefined' && echonestArtist.foreign_ids.length > 0 )
								artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
						});
						
						SpotifyService.getArtists( artisturis )
							.then( function( response ){
								$scope.recommendations.currentArtist.recommendations = response.artists;
							});
					}
				});
		}
			
			
			
		// ================= GENERAL RECOMMENDED ARTISTS ==== //
		
		EchonestService.recommendedArtists()
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestArtists = [];
				if( typeof(response.response) !== 'undefined' && typeof(response.response.artists) !== 'undefined')
					echonestArtists = response.response.artists;
					
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestArtists.length <= 0 ){
				
					NotifyService.error( 'Your taste profile is empty. Play some more music!' );
					
				}else{
					
					angular.forEach( echonestArtists, function( echonestArtist ){
						artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.then( function( spotifyArtists ){
							$scope.recommendations.suggestions = spotifyArtists.artists;
						});
				}
			});
	}
	
});





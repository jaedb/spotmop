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
	
	$scope.sections = [];	
	
	SpotifyService.getMyFavorites('artists').then( function(response){
		$scope.sections.push({
			title: 'Some old favorites',
			items: response.items
		});
	});
	
	// get our recommended artists
	if( SettingsService.getSetting('echonest', false, 'enabled')){
			
			
			
		/** 
		 * General recommendations based on the Echonest taste profile
		 **/
		
		EchonestService.recommendedArtists()
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestArtists = [];
				if( typeof(response.response) !== 'undefined' && typeof(response.response.artists) !== 'undefined')
					echonestArtists = response.response.artists;
					
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestArtists.length > 0 ){
					
					angular.forEach( echonestArtists, function( echonestArtist ){
						artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.then( function( spotifyArtists ){
							$scope.sections.push({
								title: 'Reccommended for you',
								items: spotifyArtists.artists
							});
						});
				}
			});
	
			
		/**
		 * Recommendations based on the currently playing track
		 * We need to listen for the complete loading of the currentTlTrack for this to work smoothly
		 **/
		 
		if( typeof( $scope.state().currentTlTrack.track ) !== 'undefined' ){
			getCurrentlyPlayingRecommendations( $scope.state().currentTlTrack );
		}
		$rootScope.$on('spotmop:currenttrack:loaded', function(event, tlTrack){
			getCurrentlyPlayingRecommendations( tlTrack );
		});
	}
	
	// actually go get the recommendations
	function getCurrentlyPlayingRecommendations( tlTrack ){
	
		var artists = [];
		angular.forEach( tlTrack.track.artists, function(artist){
			artists.push(
				{
					'name': artist.name,
					'name_encoded': encodeURIComponent(artist.name),
					'uri': artist.uri
				}
			);
		});
	
		EchonestService.recommendedArtists( artists )
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestArtists = response.response.artists;
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestArtists.length > 0 ){
					
					angular.forEach( echonestArtists, function( echonestArtist ){
						if( typeof( echonestArtist.foreign_ids ) !== 'undefined' && echonestArtist.foreign_ids.length > 0 )
							artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.then( function( response ){
							$scope.sections.push({
								title: 'Because you\'re listening to ',
								artists: tlTrack.track.artists,
								items: response.artists
							});
						});
				}
			});
	}
	
});





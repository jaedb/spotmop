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
.controller('DiscoverController', function DiscoverController( $scope, $rootScope, $filter, SpotifyService, SettingsService, NotifyService ){
	
	$scope.favorites = [];
	$scope.current = [];
	$scope.sections = [];
	
	// get my old favorites
	SpotifyService.getMyFavorites('artists', false, false, 'long_term').then( function(response){		
		$scope.favorites.items = response.items;
	});
	
	
	// get my short-term top tracks
	SpotifyService.getMyFavorites('tracks', 50, false, 'short_term').then( function(response){
		
		// shuffle our tracks for interest, and limit to 5
		var favoriteTracks = response.items;
		favoriteTracks = $filter('shuffle')(response.items);
		favoriteTracks = $filter('limitTo')(response.items, 5);
		
		angular.forEach( favoriteTracks, function(track){
			SpotifyService.getRecommendations(false, false, false, false, track.id).then( function(recommendations){
				var items = [];
				angular.forEach( recommendations.tracks, function( track ){
					var item = track.album;
					item.artists = track.artists;
					items.push( item );
				});
				var section = {
					title: 'Because you listened to ',
					artists: track.artists,
					items: items
				}
				$scope.sections.push( section );
			});
		});
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
	
	// actually go get the recommendations
	function getCurrentlyPlayingRecommendations( tlTrack ){
	
		var artists = [];
		var artistIds = '';
		angular.forEach( tlTrack.track.artists, function(artist){
		
			// create our template-friendly array of artists
			artists.push(
				{
					'name': artist.name,
					'name_encoded': encodeURIComponent(artist.name),
					'uri': artist.uri
				}
			);
			
			// build our list of seed artists (because our current track might contain multiple artists)
			if( artistIds != '' ) artistIds += ',';
			artistIds += SpotifyService.getFromUri('artistid',artist.uri);
		});
		
		// store our seed artists for the template
		$scope.current.artists = artists;
		
		// now get recommendations based on these artists
		SpotifyService.getRecommendations(false, false, artistIds).then( function(response){
			var albums = [];
			
			angular.forEach( response.tracks, function( track ){
				var album = track.album;
				album.artists = track.artists;
				albums.push( album );
			});
			
			$scope.current.items = albums;
		});
	}
	
});





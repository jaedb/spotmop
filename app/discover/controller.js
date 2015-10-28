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
.controller('DiscoverController', function DiscoverController( $scope, $rootScope, SpotifyService, EchonestService, SettingsService ){
	
	$scope.artists = [];
	$scope.playlists = [];
	$scope.albums = [];
	$scope.recommendations = {
		currentArtist: {
			names: [],
			recommendations: []
		},
		suggestions: []
	};
	
	// get our recommended artists
	if( SettingsService.getSetting('echonestenabled','false') ){
		
		
		// ================= CATALOG RADIO ==== //
		
		/*
		EchonestService.favoriteArtists()
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestSongs = response.response.songs;
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestSongs.length <= 0 ){
				
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'discover', message: 'Your taste profile is empty. Play some more music!'});
					
				}else{
				
					$rootScope.requestsLoading++;
					
					angular.forEach( echonestSongs, function( echonestSong ){
						artisturis.push( echonestSong.artist_foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.success( function( response ){
							$rootScope.requestsLoading--;
							$scope.artists = response.artists;
						})
						.error(function( error ){
							$rootScope.requestsLoading--;
							$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-discover', message: error.error.message});
						});
				}
			});
			*/
			
		// ================= BASED ON CURRENT PLAYING ARTIST ==== //
		
		if( typeof($scope.state().currentTlTrack.track) !== 'undefined' ){
			var artistNames = [];
			angular.forEach( $scope.state().currentTlTrack.track.artists, function(artist){
				artistNames.push( artist.name );
			});
			$scope.recommendations.currentArtist.names = artistNames;
		}
		
		EchonestService.recommendedArtists( $scope.recommendations.currentArtist.names )
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestArtists = response.response.artists;
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestArtists.length <= 0 ){
				
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'discover', message: 'Your taste profile is empty. Play some more music!'});
					
				}else{
				
					$rootScope.requestsLoading++;
					
					angular.forEach( echonestArtists, function( echonestArtist ){
						artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.success( function( response ){
							$rootScope.requestsLoading--;
							$scope.recommendations.currentArtist.recommendations = response.artists;
						})
						.error(function( error ){
							$rootScope.requestsLoading--;
							$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-discover', message: error.error.message});
						});
				}
			});
			
			
			
		// ================= GENERAL RECOMMENDED ARTISTS ==== //
		
		EchonestService.recommendedArtists()
			.then(function( response ){
			
				// convert our echonest list into an array to get from spotify
				var echonestArtists = response.response.artists;
				var artisturis = [];
				
				// make sure we got some artists
				if( echonestArtists.length <= 0 ){
				
					$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'discover', message: 'Your taste profile is empty. Play some more music!'});
					
				}else{
				
					$rootScope.requestsLoading++;
					
					angular.forEach( echonestArtists, function( echonestArtist ){
						artisturis.push( echonestArtist.foreign_ids[0].foreign_id );
					});
					
					SpotifyService.getArtists( artisturis )
						.success( function( response ){
							$rootScope.requestsLoading--;
							$scope.recommendations.suggestions = response.artists;
						})
						.error(function( error ){
							$rootScope.requestsLoading--;
							$rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-discover', message: error.error.message});
						});
				}
			});
	}
	
});





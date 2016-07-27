'use strict';

angular.module('spotmop.discover', [])

/**
 * Routing 
 **/
.config(function($stateProvider){
	
	$stateProvider
		.state('discover', {
			url: "/discover",
			templateUrl: "app/discover/template.html"
		})
		.state('discover.recommendations', {
			url: "/recommendations",
			templateUrl: "app/discover/recommendations.template.html",
			controller: 'DiscoverRecommendationsController'
		})
		.state('discover.similar', {
			url: "/similar/:uri",
			templateUrl: "app/discover/similar.template.html",
			controller: 'DiscoverSimilarController'
		});
})
	
/**
 * Recommendations
 **/
.controller('DiscoverRecommendationsController', function DiscoverRecommendationsController( $scope, $rootScope, $filter, SpotifyService, SettingsService, NotifyService ){
	
	$scope.favorites = [];
	$scope.current = [];
	$scope.sections = [];
	
	// get my old favorites
	SpotifyService.getMyFavorites('artists', 50, false, 'long_term').then( function(response){		
		$scope.favorites.items = $filter('shuffle')(response.items);
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
	
})
	
/**
 * Discover material, similar to a seed URI
 **/
.controller('DiscoverSimilarController', function DiscoverSimilarController( $scope, $rootScope, $filter, $stateParams, SpotifyService, SettingsService, NotifyService ){
	
	var seed_tracks = [];
	var seed_albums = [];
	var seed_artists = [];
	var uris = $stateParams.uri.split(',');
	
	for( var i = 0; i < uris.length; i++ ){
		switch( SpotifyService.uriType( uris[i] ) ){
			case 'track':
				seed_tracks.push( SpotifyService.getFromUri('trackid', uris[i]) );
				break;
			case 'album':
				seed_albums.push( SpotifyService.getFromUri('albumid', uris[i]) )
				break;
			case 'artist':
				seed_artists.push( SpotifyService.getFromUri('artistid', uris[i]) )
				break;
		}
	}
	
	// merge our arrays of ids back into a comma-separated string, or a null variable if empty
	( seed_tracks.length > 0 ? seed_tracks = seed_tracks.join(',') : seed_tracks = null );
	( seed_albums.length > 0 ? seed_albums = seed_albums.join(',') : seed_albums = null );
	( seed_artists.length > 0 ? seed_artists = seed_artists.join(',') : seed_artists = null );
	
	// get from spotify ( limit, offset, seed_artists, seed_albums, seed_tracks )
	SpotifyService.getRecommendations( 50, 0, seed_artists, seed_albums, seed_tracks).then( function(response){		
		$scope.tracks = response.tracks;
	});
});





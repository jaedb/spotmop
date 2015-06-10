'use strict';

angular.module('spotmop.browse.artist', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
    
	$stateProvider
		.state('browse.artist', {
			url: "/artist/:uri",
            //abstract: true,
			templateUrl: "app/browse/artist/template.html",
            controller: ['$scope', '$state', 
                function( $scope, $state) {
                    $state.go('browse.artist.overview');
                }]
		})
		.state('browse.artist.overview', {
			url: "/overview",
			templateUrl: "app/browse/artist/overview.template.html"
		})
		.state('browse.artist.related', {
			url: "/related",
			templateUrl: "app/browse/artist/related.template.html"
		})
		.state('browse.artist.biography', {
			url: "/biography",
			templateUrl: "app/browse/artist/biography.template.html"
		});
})


.directive('textOverImage', function() {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            
            $scope.$on('spotmop:pageUpdated', function(event){
                BackgroundCheck.init({
                    targets: $($element).parent(),
                    images: $(document).find('.artist-intro .image')
                });
                BackgroundCheck.refresh();
            });
        }
    };
})


/**
 * Main controller
 **/
.controller('ArtistController', function ArtistController( $scope, $rootScope, $timeout, SpotifyService, EchonestService, $stateParams, $sce ){
	
	$scope.artist = {};
	$scope.tracks = {};
	$scope.albums = {};
	$scope.relatedArtists = {};
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-artist', message: 'Loading'});
    
	// get the artist
	SpotifyService.getArtist( $stateParams.uri )
		.success( function( response ){
		
			$scope.artist = response;
    
            // get the biography
            EchonestService.getArtistBiography( $stateParams.uri )
                .success( function( response ){
                    $scope.artist.biography = response.response.biographies[0];
                });
		
			// get the artist's albums
			SpotifyService.getAlbums( $stateParams.uri )
				.success( function( response ){
					$scope.albums = response;
				
					// get the artist's top tracks
					SpotifyService.getTopTracks( $stateParams.uri )
						.success( function( response ){
							$scope.tracks = response.tracks;
				
							// get the artist's related artists
							SpotifyService.getRelatedArtists( $stateParams.uri )
								.success( function( response ){
									$scope.relatedArtists = response.artists;
									$rootScope.$broadcast('spotmop:pageUpdated');
                                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-artist'});
								})
                                .error(function( error ){
                                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-artist'});
                                    $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-artist', message: error.error.message});
                                });
						});
				});
		});
	
});
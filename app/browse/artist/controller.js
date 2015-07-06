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
					// if we're at the index level, go to the overview sub-state by default
					// this prevents re-routing on refresh even if the URL is a valid sub-state
					if( $state.current.name === 'browse.artist' )
                    	$state.go('browse.artist.overview');
                }]
		})
		.state('browse.artist.overview', {
			url: "/overview",
			templateUrl: "app/browse/artist/overview.template.html",
			controller: 'ArtistOverviewController'
		})
		.state('browse.artist.related', {
			url: "/related",
			templateUrl: "app/browse/artist/related.template.html",
			controller: 'RelatedArtistsController'
		})
		.state('browse.artist.biography', {
			url: "/biography",
			templateUrl: "app/browse/artist/biography.template.html",
			controller: 'ArtistBiographyController'
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
.controller('ArtistController', function ArtistController( $scope, $rootScope, $timeout, SpotifyService, $stateParams, $sce ){
	
	$scope.artist = {};
	$scope.tracks = {};
	$scope.albums = {};
	$scope.relatedArtists = {};
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-artist', message: 'Loading'});
    
	// get the artist
	SpotifyService.getArtist( $stateParams.uri )
		.success( function( response ){
		
			$scope.artist = response;
		
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
    
    // on scroll, create some nice parallax for the banner image
    $('#body').on('scroll', function(evt){
        
        // get our ducks in a row - these are all the numbers we need
        var scrollPosition = $(this).scrollTop();
		var banner = $(document).find('.artist-intro > .image-container');
        var bannerHeight = banner.outerHeight();
		
		// if we have the banner in the viewport
		if( scrollPosition <= bannerHeight ){
			
			// calculate how far down the banner we've scrolled
			var percent = -( scrollPosition / bannerHeight * 15 );
			
			// and finally apply to the image
			banner.find('.image').css({ top: -( percent * 10 ) });
		}
    });
	
})

/**
 * Artist overview controller
 **/
.controller('ArtistOverviewController', function ArtistOverviewController( $scope, $timeout, $rootScope ){
	
	// when the related artists array changes (ie on API response, page load, etc)
	$scope.$watch('relatedArtists', function(){

		// wait for $digest
		$timeout( function(){
			$scope.resquarePanels();
		},
		0);
	});
	
})


/**
 * Related artists controller
 **/
.controller('RelatedArtistsController', function RelatedArtistsController( $scope, $timeout, $rootScope ){
	
	// when the related artists array changes (ie on API response, page load, etc)
	$scope.$watch('relatedArtists', function(){

		// wait for $digest
		$timeout( function(){
			$scope.resquarePanels();
		},
		0);
	});
	
})


/**
 * Biography controller
 **/
.controller('ArtistBiographyController', function ArtistBiographyController( $scope, $timeout, $rootScope, $stateParams, EchonestService ){
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-artist-biography', message: 'Loading'});
	
	// get the biography
	EchonestService.getArtistBiography( $stateParams.uri )
		.success( function( response ){
			$scope.artist.biography = response.response.biographies[0];
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-artist-biography'});
		});
	
});
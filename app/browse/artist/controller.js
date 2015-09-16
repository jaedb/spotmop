'use strict';

angular.module('spotmop.browse.artist', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
    
	$stateProvider
		.state('browse.artist', {
			url: "/artist/:uri",
            abstract: true,
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
			url: "",
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
	$scope.tracklist = {type: 'track'};
	$scope.albums = {};
	$scope.relatedArtists = {};
	
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-artist', message: 'Loading'});
    
	// get the artist
	SpotifyService.getArtist( $stateParams.uri )
		.success( function( response ){
			$scope.artist = response;
		
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
})

/**
 * Artist overview controller
 **/
.controller('ArtistOverviewController', function ArtistOverviewController( $scope, $timeout, $rootScope, $stateParams, SpotifyService ){
	
	// get the artist's albums
	SpotifyService.getAlbums( $stateParams.uri )
		.success( function( response ){
			$scope.albums = response;
			
			// get the artist's top tracks
			SpotifyService.getTopTracks( $stateParams.uri )
				.success( function( response ){
					$scope.tracklist.tracks = response.tracks;
					$rootScope.$broadcast('spotmop:pageUpdated');
				});
		});	
	
    /**
     * Load more of the playlist's tracks
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreAlbums = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreAlbums( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreAlbums = true;   
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-albums', message: 'Loading albums'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist (using our unified format of course)
                $scope.albums.items = $scope.albums.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-albums'});
                loadingMoreAlbums = false;
				
				$rootScope.$broadcast('spotmop:pageUpdated');
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-albums'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-albums', message: error.error.message});
                loadingMoreAlbums = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreAlbums && typeof( $scope.albums.next ) !== 'undefined' && $scope.albums.next ){
            loadMoreAlbums( $scope.albums.next );
        }
	});
})


/**
 * Related artists controller
 **/
.controller('RelatedArtistsController', function RelatedArtistsController( $scope, $timeout, $rootScope ){	
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
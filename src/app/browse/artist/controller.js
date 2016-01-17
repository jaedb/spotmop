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
		})
		.state('browse.artistalbum', {
			url: "/artist/:artisturi/:uri",
			templateUrl: "app/browse/album/template.html",
			controller: 'AlbumController'
		});
})


/**
 * Main controller
 **/
.controller('ArtistController', function ( $scope, $rootScope, $timeout, $interval, $stateParams, $sce, SpotifyService, SettingsService, EchonestService, NotifyService, LastfmService ){
	
	$scope.artist = {};
	$scope.tracklist = {type: 'track'};
	$scope.albums = {};
	$scope.relatedArtists = {};
    $scope.followArtist = function(){
        SpotifyService.followArtist( $stateParams.uri )
            .then( function(response){
                $scope.following = true;
            });
    }
    $scope.unfollowArtist = function(){
        SpotifyService.unfollowArtist( $stateParams.uri )
            .then( function(response){
                $scope.following = false;
            });
    }
	$scope.playArtistRadio = function(){
		NotifyService.error( 'This functionality has not yet been implemented' );
		/*
		EchonestService.startArtistRadio( $scope.artist.name )
			.then( function( response ){
				console.log( response.response );
			});
			*/
	}
    
	// get the artist from Spotify
	SpotifyService.getArtist( $stateParams.uri )
		.then( function( response ){
			$scope.artist = response;
    
			/*
			// get the artist from LastFM
			// NOT CURRENTLY REQUIRED AS IT DOESN'T PROVIDE MUCH MORE USEFUL DATA
			LastfmService.artistInfo( response.name )
				.then( function( response ){
					console.log( response );
				});
			*/
		});

	// figure out if we're following this playlist
	SpotifyService.isFollowingArtist( $stateParams.uri, SettingsService.getSetting('spotifyuserid',null) )
		.then( function( isFollowing ){
			$scope.following = $.parseJSON(isFollowing);
		});
		
	// get the artist's related artists
	SpotifyService.getRelatedArtists( $stateParams.uri )
		.then( function( response ){
			$scope.relatedArtists = response.artists;
		});
})


/**
 * Artist overview controller
 **/
.controller('ArtistOverviewController', function ArtistOverviewController( $scope, $timeout, $rootScope, $stateParams, SpotifyService ){
	
	// get the artist's albums
	SpotifyService.getAlbums( $stateParams.uri )
		.then( function( response ){
			$scope.$parent.albums = response;
			
			// get the artist's top tracks
			SpotifyService.getTopTracks( $stateParams.uri )
				.then( function( response ){
					$scope.tracklist.tracks = response.tracks;
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

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist (using our unified format of course)
                $scope.albums.items = $scope.albums.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.albums.next = response.next;
                
                // update loader and re-open for further pagination objects
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
.controller('ArtistBiographyController', function ArtistBiographyController( $scope, $timeout, $rootScope, $stateParams, SpotifyService, LastfmService ){
	
	// check if we know the artist name yet. If not, go find the artist on Spotify first
	if( typeof($scope.artist.name) === 'undefined' ){
		
		// get the artist from Spotify
		SpotifyService.getArtist( $stateParams.uri )
			.then( function( response ){
				getBio( response.name );
			});
	}else{
		getBio( $scope.artist.name );
	}
	
	// go get the biography
	function getBio( name ){
		LastfmService.artistInfo( name )
			.then( function( response ){
				$scope.artist.biography = response.artist.bio;
			});
	}
});




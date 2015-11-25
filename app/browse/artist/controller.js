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


/**
 * Main controller
 **/
.controller('ArtistController', function ( $scope, $rootScope, $timeout, $interval, $stateParams, $sce, SpotifyService, SettingsService, EchonestService, NotifyService ){
	
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
    
	// get the artist
	SpotifyService.getArtist( $stateParams.uri )
		.then( function( response ){
			$scope.artist = response;
			
			$timeout( function(){ positionArtistBackground() }, 5);
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
		
	
	// setup initial variables
	var	scrollTop = 0;
	var canvas,canvasDOM,context;
	
	function positionArtistBackground(){
		
		var canvas = $(document).find('#artistBackground');
		var canvasDOM = document.getElementById('artistBackground');
		var context = canvasDOM.getContext('2d');
		
		// set our canvas dimensions
		var width = $(document).find('.artist-intro').outerWidth();
		var height = $(document).find('.artist-intro').outerHeight();
		context.canvas.width = width;
		context.canvas.height = height;
		
		var percent = Math.round( scrollTop / height * 100 );
		var position = Math.round( (height / 2) * (percent/100) ) - 100;
		
		// clear the workspace
		context.clearRect(0, 0, width, height);
		
		var image = {
			url: canvas.attr('image-url'),
			width: canvas.attr('image-width'),
			height: canvas.attr('image-height'),
			x: 0,
			y: 0
		};
		var imageObject = new Image();
		imageObject.src = image.url;
		
		if( image.width < width ){
			var upscale = width / image.width;
			image.width = image.width * upscale;
			image.height = image.height * upscale;
		}
		
		image.x = ( width / 2 ) - ( image.width / 2 );
		image.y = ( ( height / 2 ) - ( image.height / 2 ) ) + ( ( percent / 100 ) * 100);
	
		context.drawImage(imageObject, image.x, image.y, image.width, image.height);		
	}
	
	$interval(
		function(){	
			window.requestAnimationFrame(function( event ){
			
				// if we've scrolled
				if( scrollTop != $('.scrolling-panel').scrollTop() ){
					scrollTop = $('.scrolling-panel').scrollTop();
					
					var bannerHeight = $(document).find('.artist-intro').outerHeight();

					// and if we're within the bounds of our document
					// this helps prevent us animating when the objects in question are off-screen
					if( scrollTop < bannerHeight ){
						
						positionArtistBackground( scrollTop );		
						
						
						/*
						var percent = Math.round( scrollTop / bannerHeight * 100 );
						//var position = Math.round( (bannerHeight / 2) * (percent/100) ) - 100;
						var position = Math.round( (bannerHeight / 2) * (percent/100) ) - 100;
						
						$(document).find('.intro preloadedimage').css('top', position+'px');
						*/
					}
				}
			});
		},
		10
	);
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
.controller('ArtistBiographyController', function ArtistBiographyController( $scope, $timeout, $rootScope, $stateParams, EchonestService ){
	
	// get the biography
	EchonestService.getArtistBiography( $stateParams.uri )
		.then( function( response ){
			$scope.artist.biography = response.response.biographies[0];
		});
	
});
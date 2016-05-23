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
.controller('ArtistController', function ( $scope, $rootScope, $timeout, $interval, $stateParams, $sce, $filter, SpotifyService, SettingsService, MopidyService, NotifyService, LastfmService ){
	
	$scope.artist = {};
	$scope.tracklist = { type: 'track' };
	$scope.albums = { items: [] };
	$scope.relatedArtists = {};
	var uri = $stateParams.uri;
	uri = uri = uri.replace('|','/');
	$scope.origin = $filter('assetOrigin')(uri);
	
	
	/**
	 * Spotify artists
	 **/
	if( $scope.origin == 'spotify' ){
		
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
			
			NotifyService.notify('Playing all top tracks');
			
			// get the artist's top tracks
			SpotifyService.getTopTracks( $stateParams.uri )
				.then( function( response ){
					var uris = [];
					for( var i = 0; i < response.tracks.length; i++ ){
						uris.push( response.tracks[i].uri );
					}
					MopidyService.playTrack( uris, 0 );
				});
		}
		
		// get the artist from Spotify
		SpotifyService.getArtist( $stateParams.uri )
			.then( function( response ){
				$scope.artist = response;
				$scope.artist.images = $filter('sizedImages')(response.images)
			});

		// figure out if we're following this playlist
		if( $rootScope.spotifyAuthorized ){
			SpotifyService.isFollowingArtist( $stateParams.uri, SettingsService.getSetting('spotifyuserid',null) )
				.then( function( isFollowing ){
					$scope.following = $.parseJSON(isFollowing);
				});
		}
		
		// get the artist's related artists
		SpotifyService.getRelatedArtists( $stateParams.uri )
			.then( function( response ){
				$scope.relatedArtists = response.artists;
			});
		
	
	/**
	 * Non-spotify artist, so just use Mopidy core
	 **/
	}else{
	
		// on init, go get the items (or wait for mopidy to be online)
		if( $scope.mopidyOnline ){
			getArtistFromMopidy();
		}else{
			$scope.$on('mopidy:state:online', function(){
				getArtistFromMopidy() 
			});
		}
	}
	
	/** 
	 * Fetch the artist using Mopidy core
	 **/
	function getArtistFromMopidy(){
	
		MopidyService.getArtist( uri )
			.then(function( response ){
				
				// this is not strictly accurate, but the only way to get the actual album data is from the track object
				$scope.artist = response[0].artists[0];
				
				// get artwork from LastFM
				if( typeof( $scope.artist.musicbrainz_id ) !== 'undefined' ){
					LastfmService.artistInfoByMbid( $scope.artist.musicbrainz_id )
						.then( function( response ){
							$scope.artist.images = $filter('sizedImages')(response.artist.image);
						});
				}
				
				$scope.tracklist.type = 'localtrack';
				$scope.tracklist.tracks = $filter('limitTo')(response,10);
		
				// get the artist's related artists
				// we hand this over to Spotify
				/*
				SpotifyService.getRelatedArtists( $stateParams.uri )
					.then( function( response ){
						$scope.relatedArtists = response.artists;
					});
					*/
			});
		
		// get the albums
		MopidyService.getLibraryItems( uri )
			.then( function( response ){
			
				$scope.albums.items = response;
				
				for( var i = 0; i < $scope.albums.items.length; i++ ){
					
					$scope.albums.items[i].artist = { name: $scope.artist.name };
					
					// once we get the info from lastFM
					// process it and add to our $scope
					var callback = function(n){
						return function( response ){
							$scope.albums.items[n].images = $filter('sizedImages')(response.album.image);
						};
					}(i);
					
					// get album artwork from LastFM
					if( $scope.albums.items[i].mbid ){
						LastfmService.albumInfoByMbid( $scope.albums.items[i].mbid )
							.then( callback );
					}else{
						LastfmService
							.albumInfo( $scope.albums.items[i].artist.name.trim(), $scope.albums.items[i].name.trim() )
							.then( callback );
					}
				}
			});
	}
})


/**
 * Artist overview controller
 **/
.controller('ArtistOverviewController', function ArtistOverviewController( $scope, $timeout, $rootScope, $stateParams, SpotifyService ){


	/**
	 * Spotify artists
	 **/
	if( $scope.origin == 'spotify' ){
			
		// get the artist's albums
		SpotifyService.getArtistAlbums( $stateParams.uri )
			.then( function( response ){
				$scope.$parent.albums = response;
			});	
		
		// get the artist's top tracks
		SpotifyService.getTopTracks( $stateParams.uri )
			.then( function( response ){
				$scope.tracklist.tracks = response.tracks;
			});
		
		// once we're told we're ready to load more albums
		$scope.$on('spotmop:loadMore', function(){
			if( !loadingMoreAlbums && typeof( $scope.albums.next ) !== 'undefined' && $scope.albums.next ){
				loadMoreAlbums( $scope.albums.next );
			}
		});
	
	/**
	 * Non-spotify artist, so just use Mopidy core
	 **/
	}else{
	
		// on init, go get the items (or wait for mopidy to be online)
		if( $scope.mopidyOnline ){
			getArtistOverviewFromMopidy();
		}else{
			$scope.$on('mopidy:state:online', function(){
				getArtistOverviewFromMopidy() 
			});
		}
	}
	
	
	/** 
	 * Fetch the artist using Mopidy core
	 **/
	function getArtistOverviewFromMopidy(){
	/*
		MopidyService.getArtist( uri )
			.then(function( response ){
				//console.log( response );
				
				// this is not strictly accurate, but the only way to get the actual album data is from the track object
				$scope.artist = response[0].artists[0];
				
				// get artwork from LastFM
				if( typeof( $scope.artist.musicbrainz_id ) !== 'undefined' ){
					LastfmService.artistInfoByMbid( $scope.artist.musicbrainz_id )
						.then( function( response ){
							$scope.artist.images = $filter('sizedImages')(response.artist.image);
						});
				}
			});
			*/
	}	
	
	
	
	
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
	
		name = name.replace('&','and');
		
		LastfmService.artistInfo( name )
			.then( function( response ){
				if( typeof(response.artist) !== 'undefined' && typeof(response.artist.bio) !== 'undefined' )
					$scope.artist.biography = response.artist.bio;
			});
	}
});




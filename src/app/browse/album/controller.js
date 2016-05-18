'use strict';

angular.module('spotmop.browse.album', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.album', {
			url: "/album/:uri",
			templateUrl: "app/browse/album/template.html",
			controller: 'AlbumController'
		});
})
	
/**
 * Main controller
 **/
.controller('AlbumController', function AlbumController( $scope, $rootScope, $stateParams, $filter, $state, MopidyService, SpotifyService, NotifyService ){	
	
	$scope.album = {};
	$scope.tracklist = {tracks: []};
	var uri = $stateParams.uri;
	uri = uri = uri.replace('|','/');
	$scope.origin = $filter('assetOrigin')(uri);
	
    $scope.convertedDate = function(){
		
		// spotify-style date
		if( typeof($scope.album.release_date) !== 'undefined' ){
		
			if( $scope.mediumScreen() ){
				return $filter('date')($scope.album.release_date, "yyyy");
			}else{
				if( $scope.album.release_date_precision == 'day' )
					return $filter('date')($scope.album.release_date, "MMMM d, yyyy");
				if( $scope.album.release_date_precision == 'month' )
					return $filter('date')($scope.album.release_date, "MMMM yyyy");
				if( $scope.album.release_date_precision == 'year' )
					return $scope.album.release_date;
			}
		
		// mopidy-style date
		}else if( typeof($scope.album.date) !== 'undefined' ){		
			return $scope.album.date;
		}
		
        return null;
    }
	
    // figure out the total time for all tracks
    $scope.totalTime = function(){
	
        var totalTime = 0;
        if( typeof($scope.tracklist.tracks) !== 'undefined' ){
            angular.forEach( $scope.tracklist.tracks, function( track ){
			
				// spotify-style duration
				if( typeof(track.duration_ms) !== 'undefined' ){
				    totalTime += track.duration_ms;
					
				// mopidy-style duration
				}else if( typeof(track.length) !== 'undefined' ){
				    totalTime += track.length;
				}
            });
        }
        return Math.round(totalTime / 100000); 
    }
    
	// play the whole album
	$scope.playAlbum = function(){
		MopidyService.playStream( uri );
	}
	
	/**
	 * Spotify type albums
	 **/
	if( $scope.origin == 'spotify' ){
	
		// add album to library
		$scope.addToLibrary = function(){		
			SpotifyService.addAlbumsToLibrary( $scope.album.id )
				.then( function(){
					$scope.isInLibrary = true;
				});
		}
		
		// remove from library
		$scope.removeFromLibrary = function(){		
			SpotifyService.removeAlbumsFromLibrary($scope.album.id)
				.then( function(){
					$scope.isInLibrary = false;
				});
		}
		
		getAlbumFromSpotify();
	
		// once we're told we're ready to load more tracks
		$scope.$on('spotmop:loadMore', function(){
			if( !loadingMoreTracks && typeof( $scope.tracklist.next ) !== 'undefined' && $scope.tracklist.next ){
				loadMoreTracks( $scope.tracklist.next );
			}
		});
	
	/**
	 * Not a spotify album, just use Mopidy core
	 **/
	}else{
	
		// on init, go get the items (or wait for mopidy to be online)
		if( $scope.mopidyOnline ){
			getAlbumFromMopidy();
		}else{
			$scope.$on('mopidy:state:online', function(){
				getAlbumFromMopidy() 
			});
		}
	}
	
		
	/**
	 * Fetch the album from spotify
	 **/
	function getAlbumFromSpotify(){
	
		SpotifyService.getAlbum( uri )
			.then(function( response ) {
				
				$scope.album = response;
				$scope.album.totalTracks = response.tracks.total;
				$scope.tracklist = response.tracks;
				$scope.tracklist.type = 'track';
				$scope.tracklist.tracks = response.tracks.items;
				
				angular.forEach( $scope.tracklist.tracks, function(track){
					track.album = $scope.album;
				});
				
				var artisturis = [];
				angular.forEach( response.artists, function( artist ){
					artisturis.push( artist.uri );
				});
				
				// now get the artist objects
				SpotifyService.getArtists( artisturis )
					.then( function( response ){
						$scope.album.artists = response.artists;
					});
					
				// if we're viewing from within an individual artist, get 'em
				if( typeof($stateParams.artisturi) !== 'undefined' ){		
					// get the artist from Spotify
					SpotifyService.getArtist( $stateParams.artisturi )
						.then( function( response ){
							$scope.artist = response;
						});
				}
				
				// figure out if we have this album in our library already
				SpotifyService.isAlbumInLibrary([$scope.album.id])
					.then( function( isInLibrary ){
						$scope.isInLibrary = isInLibrary[0];
					});
			});
	}
		
	
	/** 
	 * Fetch the album using Mopidy core
	 **/
	function getAlbumFromMopidy(){
	
		MopidyService.getAlbum( uri )
			.then(function( response ) {
				
				// an empty response from Mopidy
				if( response.length <= 0 ){
					NotifyService.error('Could not load uri: '+uri);
					return;
				}
				
				$scope.album = response[0].album;
				$scope.album.artists = response[0].artists;
				$scope.album.totalTracks = $scope.album.num_tracks;
				$scope.tracklist = { type: 'localtrack', tracks: response };
				
				console.log( response );
				
				MopidyService.getImages( [uri] )
					.then( function(images){
					
						// provided we got some images, load them into our album
						if( typeof(images[uri]) !== 'undefined' && images[uri].length > 0 ){ 
							$scope.album.images = images[uri];
							
							// rename all our uri parameters into url parameters for consistency
							for( var i = 0; i < $scope.album.images.length; i++ ){
								$scope.album.images[i].url = $scope.album.images[i].uri;
							}
						}
						
					});
			});
	}
	
    /**
     * Load more of the album's tracks
     * Triggered by scrolling to the bottom
     **/
	 
    var loadingMoreTracks = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreTracks( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreTracks = true;   

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.tracklist.tracks = $scope.tracklist.tracks.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.tracklist.next = response.next;
                
                // update loader and re-open for further pagination objects
                loadingMoreTracks = false;
            });
    }
});
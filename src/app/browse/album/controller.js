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
.controller('AlbumController', function AlbumController( $scope, $rootScope, $stateParams, $filter, $state, MopidyService, SpotifyService, NotifyService, LastfmService ){	
	
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
                $scope.album.images = $filter('sizedImages')(response.images);
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
                        $scope.album.artists = [];
                        if( response.artists ){
                            for( var i = 0; i < response.artists.length; i++ ){
                                var artist = response.artists[i];
                                artist.images = $filter('sizedImages')(artist.images);
                                $scope.album.artists.push( artist );
                            };
                        }
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
				
				// this is not strictly accurate, but the only way to get the actual album data is from the track object
				$scope.album = response[0].album;
				$scope.album.artists = [];
				$scope.album.totalTracks = $scope.album.num_tracks;
				$scope.tracklist = { type: 'localtrack', tracks: response };
				
				MopidyService.testMethod( 'mopidy.library.getImages', {uris: [uri] } )
					.then( function( response ){
						console.log(response); 
					});
				
				// get all our album artist and compile into an array
				var uniqueArtists = [];
				for( var i = 0; i < $scope.tracklist.tracks.length; i++ ){
					var artists = $scope.tracklist.tracks[i].artists;
					
					for( var j = 0; j < artists.length; j++ ){
						uniqueArtists[artists[j].uri] = artists[j];
					}
				}
				
				// flatten out our dictionary-style array
				for( var index in uniqueArtists ){
                    $scope.album.artists.push( uniqueArtists[index] );
                }
                
                // get artwork for the artists
                for( var i = 0; i < $scope.album.artists.length; i++ ){
                    
                    // once we get the info from lastFM
                    // process it and add to our $scope
                    var callback = function(n){
                        return function( response ){
                            if( typeof(response.artist) !== 'undefined'){
                                $scope.album.artists[n].images = $filter('sizedImages')(response.artist.image);
                            }
                        };
                    }(i);
					
					// if we have a musicbrainz_id, get imagery from LastFM
					if( typeof($scope.album.artists[i].musicbrainz_id) !== 'undefined' ){
						LastfmService.artistInfoByMbid( $scope.album.artists[i].musicbrainz_id )
							.then( callback );
                    }else{
						LastfmService.artistInfo( $scope.album.artists[i].name )
							.then( callback );
                    }
                }
				
				// get album artwork from LastFM
				if( typeof( $scope.album.musicbrainz_id ) !== 'undefined' ){
					LastfmService.albumInfoByMbid( $scope.album.musicbrainz_id )
						.then( function( response ){
							if( typeof(response.album) !== 'undefined' ){
								$scope.album.images = $filter('sizedImages')(response.album.image);
							}
						});
				}else{
					var firstUniqueArtist = uniqueArtists[Object.keys(uniqueArtists)[0]];
					LastfmService.albumInfo( firstUniqueArtist.name.trim(), $scope.album.name.trim() )
						.then( function( response ){
							if( typeof(response.album) !== 'undefined' ){
								$scope.album.images = $filter('sizedImages')(response.album.image);
							}
						});
				}
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
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
.controller('AlbumController', function AlbumController( $scope, $rootScope, $stateParams, $filter, MopidyService, SpotifyService ){
	
	$scope.album = {};
	$scope.tracklist = {type: 'track'};
    $scope.convertedDate = function(){
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
        return null;
    }
	
    // figure out the total time for all tracks
    $scope.totalTime = function(){
        var totalTime = 0;
        if( typeof($scope.tracklist.tracks) !== 'undefined' ){
            angular.forEach( $scope.tracklist.tracks, function( track ){
                totalTime += track.duration_ms;
            });
        }
        return Math.round(totalTime / 100000);   
    }
    
	
	/**
	 * Lazy loading
	 * When we scroll near the bottom of the page, broadcast it
	 * so that our current controller knows when to load more content
	 * NOTE: This is a clone of app.js version because we scroll a different element (.content)
	 **/
    $(document).find('.browse > .content').on('scroll', function(evt){
        
        // get our ducks in a row - these are all the numbers we need
        var scrollPosition = $(this).scrollTop();
        var frameHeight = $(this).outerHeight();
        var contentHeight = $(this).children('.inner').outerHeight();
        var distanceFromBottom = -( scrollPosition + frameHeight - contentHeight );
        
		if( distanceFromBottom <= 100 )
        	$scope.$broadcast('spotmop:loadMore');
    });
	
	
	// play the whole album
	$scope.playAlbum = function(){
		MopidyService.playStream( $scope.album.uri );
	}
	
	// add album to library
	$scope.addToLibrary = function(){
		
		var trackids = [];
		angular.forEach( $scope.tracklist.tracks, function( track ){
			trackids.push( SpotifyService.getFromUri( 'trackid', track.uri ) );
		});
		
		SpotifyService.addTracksToLibrary( trackids );
	}
	
	// get the album
	SpotifyService.getAlbum( $stateParams.uri )
		.then(function( response ) {
		
			$scope.album = response;
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
			
		});
    
	
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
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && typeof( $scope.tracklist.next ) !== 'undefined' && $scope.tracklist.next ){
            loadMoreTracks( $scope.tracklist.next );
        }
	});
});
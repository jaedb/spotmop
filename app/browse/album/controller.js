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
.controller('AlbumController', function AlbumController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.album = {};
	$scope.tracks = {};
	
    // figure out the total time for all tracks
    $scope.totalTime = function(){
        var totalTime = 0;
        if( typeof($scope.tracks.items) !== 'undefined' ){
            $.each( $scope.tracks.items, function( key, track ){
                totalTime += track.duration_ms;
            });
        }
        return Math.round(totalTime / 100000);   
    }
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-album', message: 'Loading'});
	
	// get the artist
	SpotifyService.getAlbum( $stateParams.uri )
		.success(function( response ) {
			$scope.album = response;
			$scope.tracks = response.tracks;
			
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-album'});
		})
		.error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-album'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-album', message: error.error.message});
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
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-tracks', message: 'Loading tracks'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.tracks.items = $scope.tracks.items.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.tracks.next = response.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-tracks'});
                loadingMoreTracks = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-tracks'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-tracks', message: error.error.message});
                loadingMoreTracks = false;
            });
    }
    
    // on scroll, detect if we're near the bottom
    $('#body').on('scroll', function(evt){
        
        // get our ducks in a row - these are all the numbers we need
        var scrollPosition = $(this).scrollTop();
        var frameHeight = $(this).outerHeight();
        var contentHeight = $(this).children('.inner').outerHeight();
        var distanceFromBottom = -( scrollPosition + frameHeight - contentHeight );
        
        // check if we're near to the bottom of the tracklist, and we're not already loading more tracks
        if( distanceFromBottom <= 100 && !loadingMoreTracks && $scope.tracks.next ){
            loadMoreTracks( $scope.tracks.next );
        }
    });
});
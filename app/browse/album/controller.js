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
.controller('AlbumController', function AlbumController( $scope, $rootScope, SpotifyService, $stateParams, $filter ){
	
	$scope.album = {};
	$scope.tracks = {};
    $scope.convertedDate = function(){
        if( $scope.album.release_date_precision == 'day' )
            return $filter('date')($scope.album.release_date, "MMMM d, yyyy");
        if( $scope.album.release_date_precision == 'month' )
            return $filter('date')($scope.album.release_date, "MMMM yyyy");
        if( $scope.album.release_date_precision == 'year' )
            return $scope.album.release_date;
        return null;
    }
	
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
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreTracks && typeof( $scope.tracks.next ) !== 'undefined' && $scope.tracks.next ){
            loadMoreTracks( $scope.tracks.next );
        }
	});
});
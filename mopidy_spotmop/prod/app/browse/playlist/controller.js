'use strict';

angular.module('spotmop.browse.playlist', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.playlist', {
			url: "/playlist/:uri",
			templateUrl: "app/browse/playlist/template.html",
			controller: 'PlaylistController'
		});
})
	
/**
 * Main controller
 **/
.controller('PlaylistController', function PlaylistController( $scope, $rootScope, $filter, $state, $stateParams, $sce, SpotifyService, MopidyService, SettingsService, DialogService, NotifyService ){
	
	// setup base variables
	$scope.playlist = {images: []};
	$scope.tracklist = { tracks: [], type: 'track' };
	$scope.totalTime = 0;
    $scope.following = false;
    $scope.followPlaylist = function(){
        SpotifyService.followPlaylist( $stateParams.uri )
            .then( function(response){
                $scope.following = true;
				NotifyService.notify( 'Following playlist' );
				$scope.updatePlaylists();
            });
    }
    $scope.unfollowPlaylist = function(){
        SpotifyService.unfollowPlaylist( $stateParams.uri )
            .then( function(response){
                $scope.following = false;
				NotifyService.notify( 'Playlist removed' );
				$scope.updatePlaylists();
            });
    }
    $scope.recoverPlaylist = function(){
        SpotifyService.followPlaylist( $stateParams.uri )
            .then( function(response){
                $scope.following = true;
				NotifyService.notify( 'Playlist recovered' );
				$scope.updatePlaylists();
            });
    }
    $scope.editPlaylist = function(){
        DialogService.create('editPlaylist', $scope);
    }
	
	// play the whole playlist
	$scope.playPlaylist = function(){
		MopidyService.playStream( $scope.playlist.uri, $scope.tracklist.tracks.length );
	}
	
    // figure out the total time for all tracks
    $scope.totalTime = function(){
        var totalTime = 0;
        if( $scope.tracklist.tracks.length > 0 ){
            angular.forEach( $scope.tracklist.tracks, function( track ){
				if( typeof( track ) !== 'undefined' )
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
	
	
	/**
	 * When the user changes the order of a playlist tracklist
	 * @param start = int
	 * @param range_length = int
	 * @param to_position = int
	 **/
	$scope.$on('spotmop:playlist:reorder', function( event, start, range_length, to_position ){
	
		var playlisturi = $state.params.uri;		
        
		// get spotify to start moving
		SpotifyService.movePlaylistTracks( playlisturi, start, range_length, to_position );
		
		var tracksToMove = [];
		
		// build an array of the tracks we need to move
		for( var i = 0; i < range_length; i++ )
			tracksToMove.push( $scope.tracklist.tracks[ start + i ] );
		
		// if we're dragging items down the line further, account for the tracks that we've just removed
		if( start < to_position )
			to_position = to_position - range_length;
		
		// reverse the order of our tracks to move (unexplained as to why we need this...)
		tracksToMove.reverse();
		
		// we need to apply this straight to the template, so we wrap in $apply
		$scope.$apply( function(){
		
			// remove our tracks to move (remembering to adjust Spotify's range_length value)
			$scope.tracklist.tracks.splice( start, range_length );
			
			// and now we add our moved tracks, to their new position
			angular.forEach( tracksToMove, function(trackToMove){
				$scope.tracklist.tracks.splice( to_position, 0, trackToMove );
			});
		});
	});

	// on load, fetch the playlist
	SpotifyService.getPlaylist( $stateParams.uri )
		.then(function( response ) {
		
			$scope.playlist = response;			
			$scope.tracklist.next = response.tracks.next;
			$scope.tracklist.previous = response.tracks.previous;
			$scope.tracklist.offset = response.tracks.offset;
			$scope.tracklist.total = response.tracks.total;
			$scope.tracklist.tracks = reformatTracks( response.tracks.items );
		
			// parse description string and make into real html (people often have links here)
			$scope.playlist.description = $sce.trustAsHtml( $scope.playlist.description );
        
            // figure out if we're following this playlist
            SpotifyService.isFollowingPlaylist( $stateParams.uri, SettingsService.getSetting('spotifyuserid',null) )
                .then( function( isFollowing ){
                    $scope.following = $.parseJSON(isFollowing);
                });
		});
		
	
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		// make sure the current spotify user owns this playlist
		if( $scope.playlist.owner.id !== SettingsService.getSetting('spotifyuserid') ){
			NotifyService.error( 'Cannot delete from a playlist you don\'t own' );
			
		// we own it, proceed sir
		}else{
			
			var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
			var tracksToDelete = [];
			
			// construct each track into a json object to delete
			angular.forEach( selectedTracks, function( selectedTrack, index ){
				tracksToDelete.push( {uri: selectedTrack.uri, positions: [$scope.tracklist.tracks.indexOf( selectedTrack )]} );
			});
			
			// remove tracks from DOM immediately (for snappier UX)
			// we also need to wrap this in a forced digest process to refresh the tracklist template immediately
			$scope.$apply( function(){
				$scope.tracklist.tracks = $filter('filter')($scope.tracklist.tracks, { selected: false });
			});
			
			// parse these uris to spotify and delete these tracks
			SpotifyService.deleteTracksFromPlaylist( $state.params.uri, tracksToDelete )
				.error(function( error ){
					console.log( error );
				});
		}
	});
		
	/**
	 * Reformat the track structure to the unified tracklist.track
	 * Need to strip wrapping track object
	 **/
	function reformatTracks( tracks ){
		
		var reformattedTracks = [];
		
		// loop all the tracks to add
		angular.forEach( tracks, function( track ){
			var newTrack = track.track;
			newTrack.added_at = track.added_at;
			newTrack.added_by = track.added_by;
			newTrack.is_local = track.is_local;
			reformattedTracks.push( newTrack );
		});
		
		return reformattedTracks;
	}
    
    /**
     * Load more of the playlist's tracks
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
            
                // append these new tracks to the main tracklist (using our unified format of course)
                $scope.tracklist.tracks = $scope.tracklist.tracks.concat( reformatTracks( response.items ) );
                
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
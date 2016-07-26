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
        return Math.round(totalTime / 60000);   
    }
	

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
        
            // get the owner
			if( $rootScope.spotifyAuthorized ){
				SpotifyService.getUser( $scope.playlist.owner.uri )
					.then( function( response ){
						$scope.playlist.owner = response;
					});
			}
        
            // figure out if we're following this playlist
			if( $rootScope.spotifyAuthorized ){
				SpotifyService.isFollowingPlaylist( $stateParams.uri, SettingsService.getSetting('spotifyuser',{id: null}).id )
					.then( function( isFollowing ){
						$scope.following = $.parseJSON(isFollowing);
					});
			}
    
			// if we're viewing from within a genre category, get the category
			if( typeof($stateParams.categoryid) !== 'undefined' ){				
				SpotifyService.getCategory( $stateParams.categoryid )
					.then(function( response ) {
						$scope.category = response;
					});
			}
		});
	
	
	/**
	 * When the user changes the order of a playlist tracklist
	 * @param start = int
	 * @param range_length = int
	 * @param to_position = int
	 **/
	$scope.$on('spotmop:playlist:reorder', function( event, start, range_length, to_position ){
	
		var playlisturi = $state.params.uri;
		var playlistOwnerID = SpotifyService.getFromUri('userid', playlisturi);
		var currentUserID = SettingsService.getSetting('spotifyuser.id');
        
		if( playlistOwnerID != currentUserID ){
			
			NotifyService.error('Cannot edit a playlist you don\'t own');
			
		}else{
			
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
		}
	});
	
	
	/**
	 * Delete the selected tracks
	 **/
	$scope.$on('spotmop:playlist:deleteSelectedTracks', function( trackuris ){		
		deleteMySelectedTracks();
	});
	
	function deleteMySelectedTracks(){
	
		var playlisturi = $state.params.uri;
		var playlistOwnerID = SpotifyService.getFromUri('userid', playlisturi);
		var currentUserID = SettingsService.getSetting('spotifyuser.id');
		
		if( playlistOwnerID != currentUserID ){
			NotifyService.error('Cannot modify to a playlist you don\'t own');
			return false;
		}
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		var trackPositionsToDelete = [];
		
		// construct each track into a json object to delete
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			trackPositionsToDelete.push( $scope.tracklist.tracks.indexOf( selectedTrack ) );
			selectedTrack.transitioning = true;
		});
		
		// parse these uris to spotify and delete these tracks
		SpotifyService.deleteTracksFromPlaylist( $scope.playlist.uri, $scope.playlist.snapshot_id, trackPositionsToDelete )
			.then( function(response){
			
					// rejected
					if( typeof(response.error) !== 'undefined' ){
						NotifyService.error( response.error.message );
					
						// un-transition and restore the tracks we couldn't delete
						angular.forEach( selectedTracks, function( selectedTrack, index ){
							selectedTrack.transitioning = false;
						});
					// successful
					}else{						
						// remove tracks from DOM
						$scope.tracklist.tracks = $filter('nullOrUndefined')( $scope.tracklist.tracks, 'selected' );
						
						// update our snapshot so Spotify knows which version of the playlist our positions refer to
						$scope.playlist.snapshot_id = response.snapshot_id;
					}
				});
	}
		
	
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		deleteMySelectedTracks();
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
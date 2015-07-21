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
.controller('PlaylistController', function PlaylistController( $scope, $rootScope, $filter, $state, $stateParams, $sce, SpotifyService, SettingsService, DialogService ){
	
	// setup base variables
	$scope.playlist = {};
	$scope.tracklist = { tracks: [] };
	$scope.totalTime = 0;
    $scope.following = false;
    $scope.followPlaylist = function(){
        SpotifyService.followPlaylist( $stateParams.uri )
            .success( function(response){
                $scope.following = true;
    			$rootScope.$broadcast('spotmop:notifyUser', {id: 'following-playlist', message: 'Following playlist', autoremove: true});
				$scope.updatePlaylists();
            });
    }
    $scope.unfollowPlaylist = function(){
        SpotifyService.unfollowPlaylist( $stateParams.uri )
            .success( function(response){
                $scope.following = false;
    			$rootScope.$broadcast('spotmop:notifyUser', {id: 'removing-playlist', message: 'Playlist removed', autoremove: true});
				$scope.updatePlaylists();
            });
    }
    $scope.recoverPlaylist = function(){
        SpotifyService.followPlaylist( $stateParams.uri )
            .success( function(response){
                $scope.following = true;
    			$rootScope.$broadcast('spotmop:notifyUser', {id: 'recovering-playlist', message: 'Playlist recovered', autoremove: true});
				$scope.updatePlaylists();
            });
    }
    $scope.editPlaylist = function(){		
        DialogService.create('editPlaylist', $scope);
    }
	
    // figure out the total time for all tracks
    $scope.totalTime = function(){
        var totalTime = 0;
        if( $scope.tracklist.tracks.length > 0 ){
            angular.forEach( $scope.tracklist.tracks, function( track ){
                totalTime += track.duration_ms;
            });
        }
        return Math.round(totalTime / 100000);   
    }
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-playlist', message: 'Loading'});

	// on load, fetch the playlist
	SpotifyService.getPlaylist( $stateParams.uri )
		.success(function( response ) {
		
			$scope.playlist = response;			
			$scope.tracklist.next = response.tracks.next;
			$scope.tracklist.tracks = reformatTracks( response.tracks.items );
		
			// parse description string and make into real html (people often have links here)
			$scope.playlist.description = $sce.trustAsHtml( $scope.playlist.description );
        
            // figure out if we're following this playlist
            SpotifyService.isFollowingPlaylist( $stateParams.uri, SettingsService.getSetting('spotifyuserid',null) )
                .success( function( isFollowing ){
                    $scope.following = $.parseJSON(isFollowing);
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-playlist'});
                });
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-playlist'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-playlist', message: error.error.message});
        });
		
	
	/**
	 * When the delete key is broadcast, delete the selected tracks
	 **/
	$scope.$on('spotmop:keyboardShortcut:delete', function( event ){
		
		var selectedTracks = $filter('filter')( $scope.tracklist.tracks, { selected: true } );
		var tracksToDelete = [];
		
		// construct each track into a json object to delete
		angular.forEach( selectedTracks, function( selectedTrack, index ){
			tracksToDelete.push( {uri: selectedTrack.uri, positions: [$scope.tracklist.tracks.indexOf( selectedTrack )]} );
		});
		
		// parse these uris to spotify and delete these tracks
		SpotifyService.deleteTracksFromPlaylist( $state.params.uri, tracksToDelete )
			.success(function( response ){
				// filter the playlist tracks to exclude all selected tracks (because we've just deleted them)
				// we could fetch a new version of the tracklist from Spotify, but that isn't really necessary
				$scope.tracklist.tracks = $filter('filter')($scope.tracklist.tracks, { selected: false });
			})
			.error(function( error ){
				console.log( error );
			});
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
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-tracks', message: 'Loading tracks'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist (using our unified format of course)
                $scope.tracklist.tracks = $scope.tracklist.tracks.concat( reformatTracks( response.items ) );
                
                // save the next set's url (if it exists)
                $scope.tracklist.next = response.next;
                
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
        if( !loadingMoreTracks && typeof( $scope.tracklist.next ) !== 'undefined' && $scope.tracklist.next ){
            loadMoreTracks( $scope.tracklist.next );
        }
	});
});
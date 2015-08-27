'use strict';

angular.module('spotmop.browse.user', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('browse.user', {
			url: "/user/:uri",
			templateUrl: "app/browse/user/template.html",
			controller: 'UserController'
		});
})
	
/**
 * Main controller
 **/
.controller('UserController', function UserController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.user = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-user', message: 'Loading'});
	
	// get the user
	SpotifyService.getUser( $stateParams.uri )
		.success(function( response ) {
			$scope.user = response;
        
            // get their playlists
            SpotifyService.getPlaylists( response.id )
                .success(function( response ) {
                    $scope.playlists = response.items;
                    $scope.next = response.next;
                    $scope.totalPlaylists = response.total;
					$rootScope.$broadcast('spotmop:pageUpdated');
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
                })
                .error(function( error ){
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
                    $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-user', message: error.error.message});
                });
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-user'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-user', message: error.error.message});
        });
    
    /**
     * Load more of the user's playlists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMorePlaylists = false;
    
    // go off and get more of this playlist's tracks
    function loadMorePlaylists( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMorePlaylists = true;   
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-playlists', message: 'Loading more'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new playlists to our existing array
                $scope.playlists = $scope.playlists.concat( response.items );
                
                // save the next set's url (if it exists)
                $scope.next = response.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-playlists'});
                loadingMorePlaylists = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-playlists'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-playlists', message: error.error.message});
                loadingMorePlaylists = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMorePlaylists && typeof( $scope.next ) !== 'undefined' && $scope.next ){
            loadMorePlaylists( $scope.next );
        }
	});
});
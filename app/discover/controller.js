'use strict';

angular.module('spotmop.discover', [])

/**
 * Routing 
 **/
.config(function($stateProvider){
	
	$stateProvider
		.state('discover', {
			url: "/discover",
			templateUrl: "app/discover/template.html"
		})
		.state('discover.browse', {
			url: "/browse",
			templateUrl: "app/discover/browse.template.html",
			controller: 'DiscoverController'
		})
		.state('discover.category', {
			url: "/category/:categoryid",
			templateUrl: "app/discover/category.template.html",
			controller: 'CategoryController'
		});
})
	
/**
 * Main controller
 **/
.controller('DiscoverController', function DiscoverController( $scope, $rootScope, SpotifyService ){
	
	$scope.categories = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-categories', message: 'Loading'});
	
	SpotifyService.discoverCategories()
		.success(function( response ) {
			$scope.categories = response.categories.items;
			$rootScope.$broadcast('spotmop:pageUpdated');
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-categories', message: error.error.message});
        });
	
})
	
/**
 * Category controller
 **/
.controller('CategoryController', function CategoryController( $scope, $rootScope, SpotifyService, $stateParams ){
	
	$scope.category = {};
	$scope.playlists = [];
    
    $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-category', message: 'Loading'});
	
	SpotifyService.getCategory( $stateParams.categoryid )
		.success(function( response ) {
			$scope.category = response;
	
            SpotifyService.getCategoryPlaylists( $stateParams.categoryid )
                .success(function( response ) {
                    $scope.playlists = response.playlists;
                    $rootScope.$broadcast('spotmop:pageUpdated');
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
                })
                .error(function( error ){
                    $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
                    $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-category', message: error.error.message});
                });
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-category'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-category', message: error.error.message});
        });
    
    
    /**
     * Load more of the category's playlists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMorePlaylists = false;
    
    // go off and get more of this playlist's tracks
    function loadMorePlaylists( $nextUrl ){
        
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMorePlaylists = true;   
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-playlists', message: 'Loading more playlists'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.playlists.items = $scope.playlists.items.concat( response.playlists.items );
                
                // save the next set's url (if it exists)
                $scope.playlists.next = response.playlists.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-playlists'});
                $rootScope.$broadcast('spotmop:pageUpdated');
                loadingMorePlaylists = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-playlists'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-playlists', message: error.error.message});
                loadingMorePlaylists = false;
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
        if( distanceFromBottom <= 100 && !loadingMorePlaylists && $scope.playlists.next ){
            loadMorePlaylists( $scope.playlists.next );
        }
    });
	
});
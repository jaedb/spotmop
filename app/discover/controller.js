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
			$scope.categories = response.categories;
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
		})
        .error(function( error ){
            $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-categories'});
            $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-categories', message: error.error.message});
        });
    
    
    /**
     * Load more of the category's playlists
     * Triggered by scrolling to the bottom
     **/
    
    var loadingMoreCategories = false;
    
    // go off and get more of this playlist's tracks
    function loadMoreCategories( $nextUrl ){
		
        if( typeof( $nextUrl ) === 'undefined' )
            return false;
        
        // update our switch to prevent spamming for every scroll event
        loadingMoreCategories = true;   
        
        $rootScope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'loading-more-categories', message: 'Loading more categories'});

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .success(function( response ){
            
                // append these new categories to the main scope
                $scope.categories.items = $scope.categories.items.concat( response.categories.items );
                
                // save the next set's url (if it exists)
                $scope.categories.next = response.categories.next;
                
                // update loader and re-open for further pagination objects
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-categories'});
                loadingMoreCategories = false;
            })
            .error(function( error ){
                $rootScope.$broadcast('spotmop:notifyUserRemoval', {id: 'loading-more-categories'});
                $rootScope.$broadcast('spotmop:notifyUser', {type: 'bad', id: 'loading-more-categories', message: error.error.message});
                loadingMoreCategories = false;
            });
    }
	
	// once we're told we're ready to load more albums
    $scope.$on('spotmop:loadMore', function(){
        if( !loadingMoreCategories && typeof( $scope.categories.next ) !== 'undefined' && $scope.categories.next ){
            loadMoreCategories( $scope.categories.next );
        }
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
        if( !loadingMorePlaylists && typeof( $scope.playlists.next ) !== 'undefined' && $scope.playlists.next ){
            loadMorePlaylists( $scope.playlists.next );
        }
	});
	
});
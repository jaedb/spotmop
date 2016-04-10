'use strict';

angular.module('spotmop.browse.genre', [])

/**
 * Routing 
 **/
.config(function($stateProvider){
	
	$stateProvider
		.state('browse.genre', {
			url: "/genre",
			templateUrl: "app/browse/genre/template.html",
			controller: 'GenreController'
		})
		.state('browse.genrecategory', {
			url: "/genre/:categoryid",
			templateUrl: "app/browse/genre/category.template.html",
			controller: 'GenreCategoryController'
		})
		.state('browse.categoryplaylist', {
			url: "/genre/:categoryid/:uri",
			templateUrl: "app/browse/playlist/template.html",
			controller: 'PlaylistController'
		});
})
	
/**
 * Main controller
 **/
.controller('GenreController', function DiscoverController( $scope, $rootScope, SpotifyService, NotifyService ){
	
	$scope.categories = [];
	
	SpotifyService.browseCategories()
		.then(function( response ) {
			$scope.categories = response.categories;
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

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new categories to the main scope
                $scope.categories.items = $scope.categories.items.concat( response.categories.items );
                
                // save the next set's url (if it exists)
                $scope.categories.next = response.categories.next;
                
                // update loader and re-open for further pagination objects
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
.controller('GenreCategoryController', function CategoryController( $scope, $rootScope, SpotifyService, $stateParams ){

	$scope.category = {};
	$scope.playlists = [];
	
	SpotifyService.getCategory( $stateParams.categoryid )
		.then(function( response ) {
			$scope.category = response;
	
            SpotifyService.getCategoryPlaylists( $stateParams.categoryid )
                .then(function( response ) {
                    $scope.playlists = response.playlists;
                });
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

        // go get our 'next' URL
        SpotifyService.getUrl( $nextUrl )
            .then(function( response ){
            
                // append these new tracks to the main tracklist
                $scope.playlists.items = $scope.playlists.items.concat( response.playlists.items );
                
                // save the next set's url (if it exists)
                $scope.playlists.next = response.playlists.next;
                
                // update loader and re-open for further pagination objects
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
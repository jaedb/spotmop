angular.module('spotmop.local', [])

/**
 * Routing 
 **/
.config(function($stateProvider) {
	$stateProvider
		.state('local', {
			url: "/local",
			templateUrl: "app/local/template.html"
		})
		.state('local.index', {
			url: "/index",
			templateUrl: "app/local/index.html",
			controller: 'LocalController'
		})
		.state('local.directory', {
			url: "/directory/:uri",
			templateUrl: "app/local/directory.html",
			controller: 'LocalDirectoryController'
		})
		.state('local.albums', {
			url: "/albums",
			templateUrl: "app/local/albums.html",
			controller: 'LocalAlbumsController'
		})
		.state('local.artists', {
			url: "/artists",
			templateUrl: "app/local/artists.html",
			controller: 'LocalArtistsController'
		});
})

	
/**
 * Landing page
 **/
.controller('LocalController', function ( $scope, $rootScope, $filter, $stateParams, $localStorage, SpotifyService, SettingsService, DialogService, MopidyService ){
		
	// on init, go get the items (or wait for mopidy to be online)
	if( $scope.mopidyOnline )
		getItems();
	else
		$scope.$on('mopidy:state:online', function(){ getItems() });
	
	// go get em
	function getItems(){
		
		MopidyService.getLibraryItems( 'local:directory' )
			.then( function( response ){
			
					// load tracks
					var trackReferences = $filter('filter')(response, {type: 'track'});
					var trackUris = [];
					
					// loop all the track references, so we can get all the track objects
					for( var i = 0; i < trackReferences.length; i++ ){
						trackUris.push( trackReferences[i].uri );
					}
					
					// take our track references and look up the actual track objects
					if( trackUris.length > 0 ){
						MopidyService.getTracks( trackUris )
							.then( function( response ){
							
								var tracks = [];
								
								// loop all the tracks to sanitize the response
								for( var key in response ){
									var track = response[key][0];
									track.type = 'localtrack';
									tracks.push( track );
								}
								
								$scope.tracks = tracks;
								$scope.allTracks = tracks;
							});
					}
					
					// organise the folders					
					var folders = [];
					for( i = 0; i < response.length; i++ ){
						if( response[i].type != 'track' )
							folders.push( response[i] );
					}
					
					var folders = formatFolders( folders );
					
					// store our folders to the template-accessible variable
					$scope.folders = folders;
					$scope.allFolders = folders;
				});
	}
	
	
	/**
	 * Format our folders into the desired format
	 * @param items = array
	 * @return array
	 **/
	function formatFolders( items ){
		
		// sanitize uris
		for( var i = 0; i < items.length; i++ ){
			var item = items[i];
			
			// replace slashes (even urlencoded ones) to ":"
			item.uri = item.uri.replace('%2F', '|');
			item.uri = item.uri.replace('/', '|');
			
			items[i] = item;
		}
		
		return items;
	}
		
})


/**
 * Artists
 **/
.controller('LocalArtistsController', function ( $scope, $rootScope, $filter, $stateParams, $localStorage, $timeout, SpotifyService, SettingsService, DialogService, MopidyService, LastfmService ){
	
	$scope.viewOptions = [
			{
				value: 'grid',
				label: 'Grid'
			},
			{
				value: 'list',
				label: 'List'
			}
		];
	$scope.sortOptions = [
			{
				value: '',
				label: 'Default'
			},
			{
				value: 'name',
				label: 'Name'
			}
		];
	
	$scope.settings = SettingsService.getSettings();
	$scope.allArtists = [];
    $scope.limit = 50;
	var uri;
	
	// watch for filter input
	$scope.$watch('filterTerm', function(val){
        $scope.limit = 50;
        $scope.artists = $filter('filter')($scope.allArtists, val);
    });
	
	// on init, go get the items (or wait for mopidy to be online)
	if( $scope.mopidyOnline )
		getItems();
	else
		$scope.$on('mopidy:state:online', function(){ getItems() });
	
	// go get em
	function getItems(){
		
		MopidyService.getLibraryItems( 'local:directory?type=artist' )
			.then( function( response ){
				
				var artists = response;
				
				// once we get the info from lastFM
				// process it and add to our $scope
				var callback = function(n){
					return function( response ){
						if( typeof(response) !== 'undefined' ){
							$scope.allArtists[n].images = $filter('sizedImages')(response.image);
						}
					};
				}(i);
				
				// get the artwork
				for( var i = 0; i < artists.length; i++ ){
				}
				
				$scope.artists = artists;
				$scope.allArtists = artists;
			});
	}
    
    // once we're told we're ready to load more
    var loading = false;
    $scope.$on('spotmop:loadMore', function(){
        if( !loading ){
            loading = true;
            $scope.limit += 50;
            if( $scope.filterTerm ){
                $scope.artists = $filter('filter')($scope.allArtists, $scope.filterTerm);
            }
            $timeout(
                function(){
                    loading = false;
                }, 1 );
        }
    });
})


/**
 * Albums
 **/
.controller('LocalAlbumsController', function ( $scope, $rootScope, $filter, $stateParams, $localStorage, $timeout, SpotifyService, SettingsService, DialogService, MopidyService, LastfmService ){
	
	$scope.viewOptions = [
			{
				value: 'grid',
				label: 'Grid'
			},
			{
				value: 'list',
				label: 'List'
			}
		];
	$scope.sortOptions = [
			{
				value: '',
				label: 'Default'
			},
			{
				value: 'name',
				label: 'Name'
			}
		];
		
	$scope.settings = SettingsService.getSettings();
	$scope.allAlbums = [];
    $scope.limit = 50;
	var uri;
	
	// watch for filter input
	$scope.$watch('filterTerm', function(val){
        $scope.limit = 50;
        $scope.albums = $filter('filter')($scope.allAlbums, val);
		if( $scope.albums.length > 0 ){
			getArtwork( $scope.albums );
		}
    });
	
	// on init, go get the items (or wait for mopidy to be online)
	if( $scope.mopidyOnline )
		getItems();
	else
		$scope.$on('mopidy:state:online', function(){ getItems() });
	
	// go get em
	function getItems(){
		
		MopidyService.getLibraryItems( 'local:directory?type=album' )
			.then( function( response ){
				$scope.allAlbums = response;
				$scope.albums = $filter('limitTo')(response,50);
				getArtwork( $scope.albums );
			});
	}
	
	// fetch artwork from Mopidy
    function getArtwork( $albums ){
	
		var uris = [];        
		for( var i = 0; i < $albums.length; i++ ){
			uris.push( $albums[i].uri );
		}
        
		// chat with Mopidy and get the images for all these URIs
		MopidyService.getImages( uris )
			.then( function(response){
			
				// loop all the response uris
				for( var key in response ){
				
					// make sure this key is valid, and we actually got some images
					if( response.hasOwnProperty(key) && response[key].length > 0 ){
						
						// find the album that this URI matches, and store it's index
						var albumByUri = $filter('filter')($scope.allAlbums, {uri: key});						
						var index = $scope.allAlbums.indexOf( albumByUri[0] );
						
						// update the album's images
						$scope.allAlbums[index].images = response[key];
					}
				}
			});
	}
	
    // once we're told we're ready to load more
    var loading = false;
    $scope.$on('spotmop:loadMore', function(){
        if( !loading ){
            loading = true;
            $scope.limit += 50;
            if( $scope.filterTerm ){
                $scope.albums = $filter('filter')($scope.allAlbums, $scope.filterTerm);
            }
            $timeout(
                function(){
                    loading = false;
					if( $scope.albums.length > 0 ){
						getArtwork( $scope.albums );
					}
                }, 1 );
        }
    });
})


/**
 * Directories
 * This is mainly to support basic libraries (like JSON) and non-asset uris
 **/
.controller('LocalDirectoryController', function ( $scope, $rootScope, $filter, $stateParams, $localStorage, SpotifyService, SettingsService, DialogService, MopidyService ){
	
	$scope.path = [{title: 'Files', uri: 'local:directory'}];
	$scope.allFolders = [];
	$scope.allTracks = [];	
	var uri;
	
	// watch for filter input
	$scope.$watch('filterTerm', function(val){
        $scope.tracks = $filter('filter')($scope.allTracks, val);
        $scope.folders = $filter('filter')($scope.allFolders, val);
    });
	
	
	if( $stateParams.uri ){
		
		uri = $stateParams.uri;
		
		// handle use of pipes to separate actual folders
		// this method is used by the json backend library, but is not needed for local-sqlite
		if( uri.indexOf('|') > -1 || uri.indexOf('local:directory:') > -1 ){
		
			// drop the local:directory: bit
			var path = uri.substring(16,uri.length);
			
			// split string into array elements (provided we're not viewing the root level already)
			if( path != '' ) path = path.split('|');
			
			// loop each 'folder' within the uri string
			if( path.length > 0 ){
				for( var i = 0; i < path.length; i++ ){
				
					var uri = 'local:directory:';
					
					// loop the whole path to re-build the uri
					for( var j = 0; j <= i; j++ ){
						if( uri != 'local:directory:' )	uri += '|';
						uri += path[j];
					}
					
					// plug our path into the template array
					$scope.path.push({
						title: decodeURIComponent( path[i] ),
						uri: uri
					});
				}
			}
			
			uri = uri.replace('|','/');
		}
	}
	
	// on init, go get the items (or wait for mopidy to be online)
	if( $scope.mopidyOnline )
		getItems();
	else
		$scope.$on('mopidy:state:online', function(){ getItems() });
	
	
	// go get em
	function getItems(){
		
		MopidyService.getLibraryItems( uri )
			.then( function( response ){
			
					// load tracks
					var trackReferences = $filter('filter')(response, {type: 'track'});
					var trackUris = [];
					
					// loop all the track references, so we can get all the track objects
					for( var i = 0; i < trackReferences.length; i++ ){
						trackUris.push( trackReferences[i].uri );
					}
					
					// take our track references and look up the actual track objects
					if( trackUris.length > 0 ){
						MopidyService.getTracks( trackUris )
							.then( function( response ){
							
								var tracks = [];
								
								// loop all the tracks to sanitize the response
								for( var key in response ){
									var track = response[key][0];
									track.type = 'localtrack';
									tracks.push( track );
								}
								
								$scope.tracks = tracks;
								$scope.allTracks = tracks;
							});
					}
					
					// organise the folders					
					var folders = [];
					for( i = 0; i < response.length; i++ ){
						if( response[i].type != 'track' )
							folders.push( response[i] );
					}
					
					var folders = formatFolders( folders );
					
					// store our folders to the template-accessible variable
					$scope.folders = folders;
					$scope.allFolders = folders;
				});
	}
	
	
	/**
	 * Format our folders into the desired format
	 * @param items = array
	 * @return array
	 **/
	function formatFolders( items ){
		
		// sanitize uris
		for( var i = 0; i < items.length; i++ ){
			var item = items[i];
			
			// replace slashes (even urlencoded ones) to ":"
			item.uri = item.uri.replace('%2F', '|');
			item.uri = item.uri.replace('/', '|');
			
			items[i] = item;
		}
		
		return items;
	}
		
});



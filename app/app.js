

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
angular.module('spotmop', [
	
	// list all our required dependencies
	'ngRoute',
	'ngResource',
	'ngStorage',
	
	'spotmop.player',
	
	'spotmop.services.settings',
	'spotmop.services.mopidy',
	'spotmop.services.spotify',
	
	'spotmop.queue',
	'spotmop.settings',
	'spotmop.playlists',
	
	'spotmop.browse.artist',
	'spotmop.browse.album',
	'spotmop.browse.playlist',
	'spotmop.browse.tracklist',
	
	'spotmop.discover',
	'spotmop.discover.featured',
	'spotmop.discover.new'
])


/* =========================================================================== ROUTING ======== */
/* ============================================================================================ */

// setup all the pages we require
.config(function($locationProvider, $routeProvider) {
	
	// use the HTML5 History API
	$locationProvider.html5Mode(true);
})

// setup a filter to convert MS to MM:SS
.filter('formatMilliseconds', function() {
	return function(ms) {
		var seconds = Math.floor((ms / 1000) % 60);
		if( seconds <= 9 )
			seconds = '0'+seconds;
		var minutes = Math.floor((ms / (60 * 1000)) % 60);
		return minutes + ":" + seconds;
	}
})


/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $localStorage, $timeout, SpotifyService, MopidyService ){

	$scope.playlists = [];
	var getPlaylists = function(){
		return $scope.playlists;
	};
	var setPlaylists = function( playlists ){
		$scope.playlists = playlists;
	};
	
	$scope.mainMenu = [
		{
			Title: 'Queue',
			Link: 'queue',
			Icon: 'list'
		},
		{
			Title: 'Discover',
			Link: 'discover',
			Icon: 'star',
			Children: [
				{ 
					Title: 'Featured playlists',
					Link: 'discover/featured'
				},
				{ 
					Title: 'New releases',
					Link: 'discover/new'
				}
			]
		},
		{
			Title: 'Playlists',
			Link: 'playlists',
			Icon: 'folder-open',
			Children: null
		},
		{
			Title: 'Settings',
			Link: 'settings',
			Icon: 'cog'
		}
	];

	$scope.$on('mopidy:state:online', function(){
		$rootScope.mopidyOnline = true;
	});
	
	$scope.$on('mopidy:state:offline', function(){
		$rootScope.mopidyOnline = false;
	});
	
	// the page content has been updated
	$scope.$on('spotmop:pageUpdated', function(){
		
		// wait for $digest
		$timeout( function(){
			
			// make all the square panels really square
			$(document).find('.square-panel').each( function(index, value){
				$(value).find('.image-container').css('height', $(value).find('.image-container').outerWidth() +'px');
			});
		},
		0);
	});
	
	
	// listen for tracklist changes, and then rewrite the broadcast to include the tracks themselves
	// TODO: Move this into the MopidyService for sanity
	$scope.$on('mopidy:event:tracklistChanged', function( newTracklist ){
		MopidyService.getCurrentTrackListTracks()
			.then(
				function( tracklist ){
					$rootScope.$broadcast('spotmop:tracklistUpdated', tracklist);
				}
			);
	});
	
	// listen for current track changes
	// TODO: Move this into the MopidyService for sanity
	$scope.$on('mopidy:event:trackPlaybackStarted', function(){
		$rootScope.$broadcast('spotmop:currentTrackChanged');
	});
		
	// let's kickstart this beast
	// we use $timeout to delay start until $digest is completed
	$timeout(
		function(){
			MopidyService.start();
		},0
	);
	
	SpotifyService.myPlaylists()
		.success(function( response ) {
			
			var sanitizedPlaylists = [];
			
			// loop all of our playlists, and set up a menu item for each
			$.each( response.items, function( key, playlist ){
			
				// we only want to add playlists that this user owns
				if( playlist.owner.id == 'jaedb' ){
					sanitizedPlaylists.push({
						Title: playlist.name,
						Link: '/browse/playlist/'+playlist.uri
					});
				}
			});
			
			// now loop the main menu to find our Playlist menu item
			for(var i in $scope.mainMenu ){
				if( $scope.mainMenu[i].Link == 'playlists'){
					// inject our new menu children
					$scope.mainMenu[i].Children = sanitizedPlaylists;
					break; //Stop this loop, we found it!
				}
			}
		})
		.error(function( error ){
			$scope.status = 'Unable to load new releases';
		});
	
});






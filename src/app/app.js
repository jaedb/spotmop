

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
angular.module('spotmop', [
	
	'ngResource',
	'ngStorage',
	'ngTouch',
	'ui.router',	
	'angular-loading-bar',
	'angular-google-analytics',
	'ngclipboard',
	
	'spotmop.directives',
	'spotmop.common.contextmenu',
	'spotmop.common.track',
	'spotmop.common.tracklist',
    
	'spotmop.services.notify',
	'spotmop.services.settings',
	'spotmop.services.player',
	'spotmop.services.spotify',
	'spotmop.services.mopidy',
	'spotmop.services.lastfm',
	'spotmop.services.dialog',
	'spotmop.services.pusher',
	
	'spotmop.player',
	'spotmop.queue',
	'spotmop.library',
	'spotmop.local',
	'spotmop.search',
	'spotmop.settings',	
	'spotmop.discover',
	
	'spotmop.browse',
	'spotmop.browse.artist',
	'spotmop.browse.album',
	'spotmop.browse.playlist',
    'spotmop.browse.user',
    'spotmop.browse.genre',
	'spotmop.browse.featured',
	'spotmop.browse.new'
])

.config(function($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider, AnalyticsProvider, cfpLoadingBarProvider){

	$urlRouterProvider.otherwise("queue");
	$httpProvider.interceptors.push('SpotifyServiceIntercepter');
	
	// initiate analytics
	AnalyticsProvider.useAnalytics(true);
	AnalyticsProvider.setAccount("UA-64701652-3");
	
	// loading bar config
	cfpLoadingBarProvider.parentSelector = 'body';
})


.run( function($rootScope, SettingsService, Analytics){
	// this code is run before any controllers
})


/* ==================================================================== APP CONTROLLER ======== */
/* ============================================================================================ */

/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $state, $localStorage, $timeout, $location, SpotifyService, MopidyService, PlayerService, SettingsService, NotifyService, PusherService, DialogService, Analytics ){	

	// track core started
	Analytics.trackEvent('Spotmop', 'Started');
		
    $rootScope.isTouchDevice = function(){
		return !!('ontouchstart' in window);
	}		
    $rootScope.isTouchMode = function(){
		
		// detect our manual override
		var pointerMode = SettingsService.getSetting('spotmop',false,'pointerMode');
		if( pointerMode == 'touch' ) return true;
		else if( pointerMode == 'click' ) return false;
		
		// no override, so use device defaults
		return $rootScope.isTouchDevice();
	}
    $scope.isSameDomainAsMopidy = function(){
		var mopidyhost = SettingsService.getSetting('mopidyhost','localhost');
		
		// if set to localhost or not set at all (then using default of localhost)
		if( !mopidyhost || mopidyhost == 'localhost' )
			return true;
		
		// custom setting, and if it matches the domain spotmop is using, then we're in business
		if( $location.host() == mopidyhost )
			return true;
		}
	$scope.state = PlayerService.state;
	$rootScope.currentTracklist = [];
	$scope.spotifyUser = {};
	$scope.menuCollapsable = false;
	$scope.reloadApp = function(){
		window.location.reload();
	}
    $scope.playlistsMenu = [];
    $scope.myPlaylists = {};
	$scope.popupVolumeControls = function(){
        DialogService.create('volumeControls', $scope);
	}
    
    /**
     * Playlists submenu
     **/
    
	// update the playlists menu
	$scope.updatePlaylists = function( userid ){
	
		SpotifyService.getPlaylists( userid, 50 )
			.then(function( response ) {
				
				$scope.myPlaylists = response.items;				
                var newPlaylistsMenu = [];
            
				// loop all of our playlists, and set up a menu item for each
				$.each( response.items, function( key, playlist ){

					// we only want to add playlists that this user owns
					if( playlist.owner.id == $scope.spotifyUser.id ){
                        var playlistObject = playlist;
                        playlistObject.link = '/browse/playlist/'+playlist.uri;
                        playlistObject.link = '/browse/playlist/'+playlist.uri;
						newPlaylistsMenu.push(playlistObject);
					}
				});
                
                // now reset our current list with this new list
                $scope.playlistsMenu = newPlaylistsMenu;
			});
	}
    
		
    
	/**
	 * Responsive
	 **/
	
	$scope.windowWidth = $(document).width();
	$scope.windowHeight = $(document).height();
	$scope.mediumScreen = function(){
		if( $scope.windowWidth <= 800 )
			return true;
		return false;
	}
	$scope.smallScreen = function(){
		if( $scope.windowWidth <= 450 )
			return true;
		return false;
	}
	
    $(window).resize(function(){
		
		// detect if the width has changed 
		// we only check width because soft keyboard reveal shouldn't hide/show the menu (ie search form)
		if( $(document).width() != $scope.windowWidth ){
			
			// update stored value
			$scope.windowWidth = $(document).width();
			
			// re-hide the sidebar and reset the body sliding
			$(document).find('body').removeClass('menu-revealed');
		}
    });
	
	// when we navigate to a new state
	$rootScope.$on('$stateChangeStart', function(event){ 
		$scope.hideMenu();
        $scope.$broadcast('spotmop:contextMenu:hide');
		Analytics.trackPage( $location.path() );
	});
	
	$(document).on('click', '#body', function(event){
		if( $(event.target).closest('.menu-reveal-trigger').length <= 0 )
			$scope.hideMenu();
	});
	
	// show menu (this is triggered by swipe event)
	$scope.showMenu = function(){
		$(document).find('body').addClass('menu-revealed');
	}
	
	// hide menu (typically triggered by swipe event)
	$scope.hideMenu = function(){
		$(document).find('body').removeClass('menu-revealed');
	}
		
	
	/**
	 * Lazy loading
	 **/

	$scope.checkForLazyLoading = function(){		
		// get our ducks in a row - these are all the numbers we need
		var scrollPosition = $(document).scrollTop();
		var frameHeight = $(window).height();
		var contentHeight = $(document).height();
		var distanceFromBottom = contentHeight - ( scrollPosition + frameHeight );
		
		if( distanceFromBottom <= 100 )
			$scope.$broadcast('spotmop:loadMore');
	}
	 
	$(document).on('scroll', function( event ){
		$scope.checkForLazyLoading();
			
		// only hide the contextmenu if we're NOT a touch device
		if( !$rootScope.isTouchMode() ){
			$rootScope.$broadcast('spotmop:contextMenu:hide');
		};
	});
	
	
	/**
	 * Search
	 **/
	$scope.searchSubmit = function( query ){
        
		// track this navigation event
		Analytics.trackEvent('Search', 'Performed search', query);
		
		// see if spotify recognises this query as a spotify uri
		var uriType = SpotifyService.uriType( query );
		
		// no? just do a normal search
		if( !uriType ){
			$state.go( 'search', { query: query } );
		
		// yes? right. Let's send you straight to the asset, depending on it's type
		}else{
		
			NotifyService.notify('You\'ve been redirected because that looked like a Spotify URI');
		
			if( uriType == 'artist' ){
				$(document).find('.search-form input').val('');
				$state.go( 'browse.artist.overview', {uri: query } );
				
			}else if( uriType == 'album' ){
				$(document).find('.search-form input').val('');
				$state.go( 'browse.album', {uri: query } );
				
			}else if( uriType == 'playlist' ){
				$(document).find('.search-form input').val('');
				$state.go( 'browse.playlist', {uri: query } );
			}
		}
	};
    
    
	/**
	 * Generate a template-friendly representation of whether this state is active or parent of active
	 * @param states = array of strings
	 * @return string
	 **/
	$scope.linkingMode = function( states ){
		
		var mode = '';
		
		// if we're not an array, make it an array (of one)
		if( !$.isArray(states) )
			states = [states];
		
		// loop our array
		angular.forEach( states, function(state){
			if( mode == '' ){
				if( $state.is( state ) )
					mode = 'active';
				else if( $state.includes( state ) )
					mode = 'section';
			};
		});
		
		return mode;
	};
    
    
    /**
     * Mopidy music player is open for business
     **/
	$scope.$on('mopidy:state:online', function(){
		Analytics.trackEvent('Mopidy', 'Online');
		$rootScope.mopidyOnline = true;
		MopidyService.getConsume().then( function( isConsume ){
			SettingsService.setSetting('mopidy',isConsume,'consume');
		});
	});
	
	$scope.$on('mopidy:state:offline', function(){
		$rootScope.mopidyOnline = false;
	});
    
	
	/**
	 * Spotify is online and authorized
	 **/
	$rootScope.spotifyAuthorized = false;
	$scope.$on('spotmop:spotify:authenticationChanged', function( event, newMethod ){
		if( newMethod == 'client' ){
			$rootScope.spotifyAuthorized = true;
			$scope.spotifyUser = SettingsService.getSetting('spotifyuser');
			$scope.updatePlaylists( $scope.spotifyUser.id );
			Analytics.trackEvent('Spotify', 'Authorized', $scope.spotifyUser.id);
		}else{
			$rootScope.spotifyAuthorized = false;
			$scope.playlistsMenu = [];
		}
	});
	
	$scope.$on('spotmop:spotify:online', function(){
		$rootScope.spotifyOnline = true;
		if( $rootScope.spotifyAuthorized ){
			$scope.spotifyUser = SettingsService.getSetting('spotifyuser');
			$scope.updatePlaylists( $scope.spotifyUser.id );
		}
	});
	
	$scope.$on('spotmop:spotify:offline', function(){
		$scope.playlistsMenu = [];
		$rootScope.spotifyOnline = false;
	});
	
    
	
	/**
	 * Settings
	 **/
	
	// some settings need extra behavior attached when changed
	$rootScope.$on('spotmop:settings:changed', function( event, data ){
		switch( data.name ){
			case 'mopidy.consume':
				MopidyService.setConsume( data.value );
				break;
		}				
	});
	
	// listen for changes from other clients
	$rootScope.$on('mopidy:event:optionsChanged', function(event, options){
		MopidyService.getConsume().then( function( isConsume ){
			SettingsService.setSetting('mopidy',isConsume,'consume');
		});
	});
	
	
	/**
	 * Pusher integration
	 **/
     
	PusherService.start();
	
    $rootScope.$on('spotmop:pusher:online', function(event, data){
        
        // if we have no client name, then initiate initial setup
		var client = SettingsService.getSetting('pushername', null);
        if( typeof(client) === 'undefined' || !client || client == '' ){
            DialogService.create('initialsetup', $scope);
			Analytics.trackEvent('Core', 'Initial setup');
		}
    });
    
	$rootScope.$on('spotmop:pusher:received', function(event, data){
		
		var icon = '';
		data.spotifyuser = JSON.parse(data.spotifyuser);
		if( typeof( data.spotifyuser.images ) !== 'undefined' && data.spotifyuser.images.length > 0 )
			icon = data.spotifyuser.images[0].url;
		
		NotifyService.browserNotify( data.title, data.body, icon );
		
		Analytics.trackEvent('Pusher', 'Notification received', data.body);
	});
    
    

    /**
     * All systems go!
     *
     * Without this sucker, we have no operational services. This is the ignition sequence.
     * We use $timeout to delay start until $digest is completed
     **/
	MopidyService.start();
	SpotifyService.start();
	
	
	/**
	 * Keyboard shortcuts
	 * We bind these to the app-level so they can be used in all directives and controllers
	 **/

	$rootScope.shiftKeyHeld = false;
	$rootScope.ctrlKeyHeld = false;
        
    // key press start
	$('body').bind('keydown',function( event ){
            if( event.which === 16 ){
                $rootScope.shiftKeyHeld = true;
            }else if( event.which === 17 ){
                $rootScope.ctrlKeyHeld = true;
            }

			// if we're about to fire a keyboard shortcut event, let's prevent default
			// this needs to be handled on keydown instead of keyup, otherwise it's too late to prevent default behavior
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled',false) ){
				var shortcutKeyCodes = new Array(46,32,13,37,38,39,40,27);
				if($.inArray(event.which, shortcutKeyCodes) > -1)
					event.preventDefault();			
			}
        })
    
        // when we release the key press
        .bind('keyup',function( event ){

			// make sure we're not typing in an input area
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled',false) ){
				
				// delete key
				if( event.which === 46 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:delete');
					
				// spacebar
				if( event.which === 32 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:space');
					
				// enter
				if( event.which === 13 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:enter');

				// navigation arrows
				if( event.which === 37 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:left');
				if( event.which === 38 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:up');
				if( event.which === 39 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:right');
				if( event.which === 40 )
					$rootScope.$broadcast('spotmop:keyboardShortcut:down');

				// esc key
				if( event.which === 27 ){
					$rootScope.$broadcast('spotmop:keyboardShortcut:esc');
					if( dragging ){
						dragging = false;
						$(document).find('.drag-tracer').hide();
					}
				}
            }
			
			// we'll also release the modifier key switches
            if( event.which === 16 )
                $rootScope.shiftKeyHeld = false;
			if( event.which === 17 )
                $rootScope.ctrlKeyHeld = false;
        }
    );
	
});






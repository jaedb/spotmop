

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
	'spotmop.services.playlistManager',
	
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
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $state, $filter, $localStorage, $timeout, $location, SpotifyService, MopidyService, PlayerService, SettingsService, NotifyService, PusherService, DialogService, PlaylistManagerService, Analytics ){
    
	// track core started
	Analytics.trackEvent('Spotmop', 'Started');
		
    $rootScope.isTouchDevice = function(){
		return !!('ontouchstart' in window);
	}		
    $rootScope.isTouchMode = function(){
	
		// detect our manual override
		var pointerMode = SettingsService.getSetting('pointerMode');
		if( pointerMode == 'touch' ) return true;
		else if( pointerMode == 'click' ) return false;
		
		// no override, so use device defaults
		return $rootScope.isTouchDevice();
	}
    $scope.isSameDomainAsMopidy = function(){
		var mopidyhost = SettingsService.getSetting('mopidy.host');
		if( !mopidyhost || $location.host() == mopidyhost ) return true;
	}
	$scope.state = PlayerService.state;
	$scope.playlists = function(){
        return PlaylistManagerService.myPlaylists();
    }
	$scope.spotifyUser = {};
	$scope.menuCollapsable = false;
	$scope.reloadApp = function(){
		window.location.reload();
	}
	$scope.popupVolumeControls = function(){
        DialogService.create('volumeControls', $scope);
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
	
		if( distanceFromBottom <= 100 ){
			$scope.$broadcast('spotmop:loadMore');
		}
	}
	
	// listen for completion from our loading bar (which intercepts all http requests)
	$rootScope.$on('cfpLoadingBar:completed', function(event){
		$scope.checkForLazyLoading();
	});
	 
	// listen for scrolling to load more stuff
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
				
			}else if( uriType == 'user' ){
				$(document).find('.search-form input').val('');
				$state.go( 'browse.user', {uri: query } );
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
		PlaylistManagerService.refreshPlaylists();
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
			Analytics.trackEvent('Spotify', 'Authorized', $scope.spotifyUser.id);
		}else{
			$rootScope.spotifyAuthorized = false;
		}
	});
	
	$scope.$on('spotmop:spotify:online', function(){
		$rootScope.spotifyOnline = true;
		if( $rootScope.spotifyAuthorized ){
			$scope.spotifyUser = SettingsService.getSetting('spotifyuser');
		}
	});
	
	$scope.$on('spotmop:spotify:offline', function(){
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
			SettingsService.setSetting('mopidy.consume',isConsume);
		});
	});
    
    

    /**
     * All systems go!
     *
     * Without this sucker, we have no operational services. This is the ignition sequence.
     * We use $timeout to delay start until $digest is completed
     **/
	PusherService.start();
	MopidyService.start();
	SpotifyService.start();
	
	// set default settings 
	if( SettingsService.getSetting('keyboardShortcutsEnabled') === null ) SettingsService.setSetting('keyboardShortcutsEnabled',true);
	
	// when a client requests sync pairing
	$rootScope.$on('spotmop:pusher:config_push', function(event, message){
        console.log( message );
		if( confirm( 'Config received from '+ message.origin.username +'. Would you like to import this? This will overwrite your current Spotify and Mopidy configuration. ') == true ){
            
            if( message.data.spotify === null ) message.data.spotify = {};
            SettingsService.setSetting('spotify', message.data.spotify);
            
            if( message.data.spotifyuser === null ) message.data.spotifyuser = {};
            SettingsService.setSetting('spotifyuser', message.data.spotifyuser);
            
            if( message.data.mopidy === null ) message.data.mopidy = {};
            SettingsService.setSetting('mopidy', message.data.mopidy);
            
            SpotifyService.start();
            
            PusherService.send({
                type: 'soft_notification',
                recipients: [ message.origin.connectionid ],
                data: {
                    body: 'Config push to <em>'+ SettingsService.getSetting('pusher.username') +'</em> accepted'
                }
            });
		}
	});
	
	
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
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled') ){
				var shortcutKeyCodes = new Array(46,32,13,37,38,39,40,27);
				if($.inArray(event.which, shortcutKeyCodes) > -1)
					event.preventDefault();			
			}
        })
    
        // when we release the key press
        .bind('keyup',function( event ){

			// make sure we're not typing in an input area
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled') ){
				
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






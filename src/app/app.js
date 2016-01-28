

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
	
	'spotmop.directives',
	'spotmop.common.contextmenu',
	'spotmop.common.tracklist',
    
	'spotmop.services.notify',
	'spotmop.services.settings',
	'spotmop.services.player',
	'spotmop.services.spotify',
	'spotmop.services.mopidy',
	'spotmop.services.echonest',
	'spotmop.services.lastfm',
	'spotmop.services.dialog',
	'spotmop.services.pusher',
	
	'spotmop.player',
	'spotmop.queue',
	'spotmop.library',
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

.config(function($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider, AnalyticsProvider){

	$urlRouterProvider.otherwise("queue");
	$httpProvider.interceptors.push('SpotifyServiceIntercepter');
	
	// initiate analytics
	AnalyticsProvider.useAnalytics(true);
	AnalyticsProvider.setAccount("UA-64701652-3");
})


.run( function($rootScope, SettingsService, Analytics){
	// this code is run before any controllers
})


/* ==================================================================== APP CONTROLLER ======== */
/* ============================================================================================ */

/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $state, $localStorage, $timeout, $location, SpotifyService, MopidyService, EchonestService, PlayerService, SettingsService, NotifyService, PusherService, DialogService, Analytics ){	

	// track core started
	Analytics.trackEvent('Spotmop', 'Started');
		
    $scope.isTouchDevice = function(){
		if( SettingsService.getSetting('emulateTouchDevice',false) )
			return true;
		return !!('ontouchstart' in window);
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
	$scope.currentTracklist = [];
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
     
    // handle manual show
    $(document).on('mouseenter', '.playlists-submenu-trigger', function( event ){
        $(document).find('.menu-item.top-level.playlists').addClass('show-submenu');
    });
    
    $(document).on('mouseleave', '.menu-item.top-level.playlists', function( event ){
        $(document).find('.menu-item.top-level.playlists').removeClass('show-submenu');
    });
    
	// update the playlists menu
	$scope.updatePlaylists = function(){
		
		SpotifyService.getPlaylists( $scope.spotifyUser.id, 50 )
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
		MopidyService.getCurrentTlTracks().then( function( tlTracks ){			
			$scope.currentTracklist = tlTracks;
		});
		MopidyService.getConsume().then( function( isConsume ){
			SettingsService.setSetting('mopidyconsume',isConsume);
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
			$scope.updatePlaylists();
			$scope.spotifyUser = SettingsService.getSetting('spotifyuser');
			Analytics.trackEvent('Spotify', 'Authorized', $scope.spotifyUser.id);
		}else{
			$rootScope.spotifyAuthorized = false;
		}
	});
	
	$scope.$on('spotmop:spotify:online', function(){
		$rootScope.spotifyOnline = true;
	});
	
	$scope.$on('spotmop:spotify:offline', function(){
		$scope.playlistsMenu = [];
		$rootScope.spotifyOnline = false;
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
	
	
	// when playback finishes, log this to EchoNest (if enabled)
	// this is not in PlayerController as there may be multiple instances at any given time which results in duplicated entries
	$rootScope.$on('mopidy:event:trackPlaybackEnded', function( event, tlTrack ){
		if( SettingsService.getSetting('echonestenabled',false) )
			EchonestService.addToTasteProfile( 'play', tlTrack.tl_track.track.uri );
	});
    
    

    /**
     * All systems go!
     *
     * Without this sucker, we have no operational services. This is the ignition sequence.
     * We use $timeout to delay start until $digest is completed
     **/
	MopidyService.start();
	SpotifyService.start();
	if(SettingsService.getSetting('echonestenabled',false))
		EchonestService.start();
	
	
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
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled',true) ){
				var shortcutKeyCodes = new Array(46,32,13,37,38,39,40,27);
				if($.inArray(event.which, shortcutKeyCodes) > -1)
					event.preventDefault();			
			}
        })
    
        // when we release the key press
        .bind('keyup',function( event ){

			// make sure we're not typing in an input area
			if( !$(document).find(':focus').is(':input') && SettingsService.getSetting('keyboardShortcutsEnabled',true) ){
				
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
	
	
	/**
	 * When we click anywhere
	 * This allows us to kill context menus, unselect tracks, etc
	 **/
	$(document).on('mouseup', 'body', function( event ){
		
		// if we've clicked OUTSIDE of a tracklist, let's kill the context menu
		// clicking INSIDE the tracklist is handled by the track/tltrack directives
		if( $(event.target).closest('.tracklist').length <= 0 ){
			$rootScope.$broadcast('spotmop:contextMenu:hide');
		}
	});
    
    /**
     * Detect if we have a droppable target
     * @var target = event.target object
     * @return jQuery DOM object
     **/
    function getDroppableTarget( target ){
        
        var droppableTarget = null;
        
        if( $(target).hasClass('droppable') )
            droppableTarget = $(target);
        else if( $(target).closest('.droppable').length > 0 )
            droppableTarget = $(target).closest('.droppable');   
        
        return droppableTarget;
    }
    
    /**
     * Detect if we have a track drop target
     * @var target = event.target object
     * @return jQuery DOM object
     **/
    function getTrackTarget( target ){
        
        var trackTarget = null;
        
		if( $(target).hasClass('track') )
			trackTarget = $(target);				
		else if( $(target).closest('.track').length > 0 )
			trackTarget = $(target).closest('.track');
        
        return trackTarget;
    }
	
	
    /**
     * Dragging of tracks
     **/
    var tracksBeingDragged = [];
    var dragging = false;
	var dragThreshold = 30;
	
	// when the mouse is pressed down on a track
	$(document).on('mousedown', 'body:not(.touchDevice) track, body:not(.touchDevice) tltrack', function(event){
					
		// get us our list of selected tracks
		var tracklist = $(event.currentTarget).closest('.tracklist');
		var tracks = tracklist.find('.track.selected');
		
		// create an object that gives us all the info we need
		dragging = {
					safetyOff: false,			// we switch this on when we're outside of the dragThreshold
					clientX: event.clientX,
					clientY: event.clientY,
					tracks: tracks
				}
	});
	
	// when we release the mouse, release dragging container
	$(document).on('mouseup', function(event){
		if( typeof(dragging) !== 'undefined' && dragging.safetyOff ){
			
            $('body').removeClass('dragging');
            $(document).find('.droppable').removeClass('dropping');
            $(document).find('.drag-hovering').removeClass('drag-hovering');
            
			// identify the droppable target that we've released on (if it exists)
			var target = getDroppableTarget( event.target );
			var track = getTrackTarget( event.target );
			
			var isMenuItem = false;
			if( target && target.closest('.main-menu').length > 0 )
				isMenuItem = true;
			
			// if we have a target
			if( target ){
				$(document).find('.drag-tracer').html('Dropping...').fadeOut('fast');
				$(document).find('.track.drag-hovering').removeClass('drag-hovering');
				
				// get the uris
				var uris = [];
				$.each( dragging.tracks, function(key, value){
					uris.push( $(value).attr('data-uri') );
				});
				
				// dropping on queue
				if( isMenuItem && target.attr('data-type') === 'queue' ){
			
					if( uris.length > 10 ){
						NotifyService.notify( 'Adding '+uris.length+' track(s) to queue... this could take some time' );
					}
                    
					MopidyService.addToTrackList( uris );
					
				// dropping on library
				}else if( isMenuItem && target.attr('data-type') === 'library' ){
					
					// convert all our URIs to IDs
					var trackids = new Array();
					$.each( uris, function(key,value){
						trackids.push( SpotifyService.getFromUri('trackid', value) );
					});
					
					SpotifyService.addTracksToLibrary( trackids );
					
				// dropping on playlist
				}else if( isMenuItem && target.attr('data-type') === 'playlist' ){
					
					SpotifyService.addTracksToPlaylist( target.attr('data-uri'), uris );	
					
				// dropping within tracklist
				}else if( track ){
                    
                    var start = 1000;
                    var end = 0;
                    var to_position = $(track).parent().index();
                    $.each(dragging.tracks, function(key, track){
                        if( $(track).parent().index() < start )  
                            start = $(track).parent().index();
                        if( $(track).parent().index() > end )  
                            end = $(track).parent().index();
                    });
                    
                    // sorting queue tracklist
                    if( track.closest('.tracklist').hasClass('queue-items') ){
						
						// destination position needs to account for length of selection offset, if we're dragging DOWN the list
						if( to_position >= end )
							to_position = to_position - uris.length;
						
						// note: mopidy want's the first track AFTER our range, so we need to +1
                        MopidyService.moveTlTracks( start, end + 1, to_position );
                        
                    // sorting playlist tracklist
                    }else if( track.closest('.tracklist').hasClass('playlist-items') ){
					
                        var range_length = 1;
                        if( end > start ){
							range_length = end - start;
							range_length++;
						};
						
						// tell our playlist controller to update it's track order, and pass it on to Spotify too
						$scope.$broadcast('spotmop:playlist:reorder', start, range_length, to_position);
                    }
				}
				
			// no target, no drop action required
			}else{
				$(document).find('.drag-tracer').fadeOut('medium');
			}
		}
			
		// unset dragging
		dragging = false;
	});
	
	// when we move the mouse, check if we're dragging
	$(document).on('mousemove', function(event){
		if( dragging ){
			
			var left = dragging.clientX - dragThreshold;
			var right = dragging.clientX + dragThreshold;
			var top = dragging.clientY - dragThreshold;
			var bottom = dragging.clientY + dragThreshold;
			
			// check the threshold distance from mousedown and now
			if( event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom ){
				
                $('body').addClass('dragging');
				$(document).find('.track.drag-hovering').removeClass('drag-hovering');
                var target = getDroppableTarget( event.target );
				var track = getTrackTarget( event.target );
                var dragTracer = $(document).find('.drag-tracer');
				
				if( track ){
					track.addClass('drag-hovering');
				}
			
				// turn the trigger safety of
				dragging.safetyOff = true;
				
                // setup the tracer
                dragTracer.show();
					
                $(document).find('.droppable').removeClass('dropping');
                $(document).find('.dropping-within').removeClass('dropping-within');
			
				var isMenuItem = false;
				if( target && target.closest('.main-menu').length > 0 )
					isMenuItem = true;
				
                if( target && isMenuItem && target.attr('data-type') === 'queue' ){
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'library' ){
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'playlists' ){
                    target.closest('.menu-item.playlists').addClass('dropping-within');
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'playlist' ){
                    target.addClass('dropping');
                    target.closest('.menu-item.playlists').addClass('dropping-within');
                }else{
                    dragTracer.html('Dragging '+dragging.tracks.length+' track(s)');
                }
			}
		}
	});
	
});






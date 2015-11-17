

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
angular.module('spotmop', [
	
	'ngResource',
	'ngStorage',
	'ngTouch',
	'ngAnimate',
	'ui.router',
	
	'spotmop.common.contextmenu',
	'spotmop.common.tracklist',
    
	'spotmop.services.settings',
	'spotmop.services.player',
	'spotmop.services.spotify',
	'spotmop.services.mopidy',
	'spotmop.services.echonest',
	'spotmop.services.dialog',
	
	'spotmop.player',
	'spotmop.queue',
	'spotmop.library',
	'spotmop.playlists',
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

.config(function($stateProvider, $locationProvider, $urlRouterProvider){
	$locationProvider.html5Mode(true);
	$urlRouterProvider.otherwise("/queue");
})




/* ======================================================================== DIRECTIVES ======== */
/* ============================================================================================ */


/** 
 * Scrollable panels
 * Facilitates scrolling of sections of the app. When near the bottom, notifies app to resume lazy-loading
 **/
.directive('scrollingPanel', function() {
	return {
		restrict: 'C',
		link: function($scope, $element, $attrs){
		
			$element.on('scroll', function( event ){
				
				// get our ducks in a row - these are all the numbers we need
				var scrollPosition = $(this).scrollTop();
				var frameHeight = $(this).outerHeight();
				var contentHeight = $(this).children('.inner').outerHeight();
				var distanceFromBottom = -( scrollPosition + frameHeight - contentHeight );
				
				if( distanceFromBottom <= 100 )
					$scope.$broadcast('spotmop:loadMore');
			});
		}
	}
})
		
		
		
/** 
 * Thumbnail image
 * Figure out the best image to use for this set of image sizes
 * @return image obj
 **/
.directive('thumbnail', function() {
	return {
		restrict: 'E',
		scope: {
			images: '=',
			size: '='
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		link: function($scope, $element, $attrs){
			
			// fetch this instance's best thumbnail
			$scope.image = getThumbnailImage( $scope.images );
			
			/**
			 * Get the most appropriate thumbnail image
			 * @param images = array of image urls
			 * @return string (image url)
			 **/
			function getThumbnailImage( images ){
				
				// what if there are no images? then nada
				if( images.length <= 0 )
					return false;

				// loop all the images
				for( var i = 0; i < images.length; i++){
					var image = images[i];
					
					// small thumbnails (ie search results)
					if( $scope.size == 'small' ){
						
						// this is our preferred size
						if( image.height >= 100 && image.height <= 200 ){
							return image;

						// let's take it a notch up then
						}else if( image.height > 200 && image.height <= 300 ){
							return image;

						// nope? let's take it the next notch up
						}else if( image.height > 300 && image.height < 400 ){
							return image;
						}
					
					// standard thumbnails (ie playlists, full related artists, etc)
					}else{
						
						// this is our preferred size
						if( image.height >= 200 && image.height <= 300 ){
							return image;

						// let's take it a notch up then
						}else if( image.height > 300 && image.height <= 500 ){
							return image;

						// nope? let's take it a notch down then
						}else if( image.height >= 150 && image.height < 200 ){
							return image;
						}						
					}
				};

				// no thumbnail that suits? just get the first (and highest res) one then        
				return images[0];
			}
			
		},
		template: '<div><div class="image animate" style="background-image: url({{ image.url }});" ng-show="image"></div><div class="image animate placeholder" ng-show="!image"></div></div>'
	};
})


/**
 * Confirmation button
 * Allows buttons to require double-click, with a "Are you sure?" prompt
 **/
.directive('confirmationButton', function() {
	return {
		restrict: 'E',
		controller: function($scope, $element){	
			
			$scope.text = 'Button text';
			$scope.confirming = false;
			$scope.text = $scope.defaultText;
			
			// bind to document-wide click events
			$(document).on('click', function(event){
				
				// if we've left-clicked on THIS confirmation button
				if( event.target == $element[0] && event.which == 1 ){
					if( $scope.confirming ){
					
						// if the function exists, perform the on-confirmation function from the directive's template
						if( typeof( $scope.$parent[ $scope.onConfirmation ]() ) === 'function' )
							$scope.$parent[ $scope.onConfirmation ]();
						
					}else{
						$scope.confirming = true;
						$scope.text = $scope.confirmationText;
						$scope.$apply();
					}
					
				// clicked on some other element on the page
				}else{
					
					// let's un-confirm the button
					$scope.confirming = false;
					$scope.text = $scope.defaultText;
					$scope.$apply();
				}
			});
		},
		scope: {
			text: '@',
			extraClasses: '@',
			confirmationText: '@',
			defaultText: '@',
			onConfirmation: '@'
		},
		replace: true, 		// Replace with the template below
		transclude: true, 	// we want to insert custom content inside the directive
		template: '<span ng-bind="text" class="button {{ extraClasses }}" ng-class="{ destructive: confirming }"></span>'
	};
})



/**
 * This let's us detect whether we need light text or dark text
 * Enhances readability when placed on dynamic background images
 * Requires spotmop:detectBackgroundColour broadcast to initiate check
 **/
.directive('textOverImage', function(){
    return {
        restrict: 'A',
        link: function($scope, $element){
            $scope.$on('spotmop:detectBackgroundColor', function(event){
                BackgroundCheck.init({
                    targets: $.merge( $($element).parent(), $(document).find('#utilities') ),
                    images: $element.closest('.intro').find('.image')
                });
				BackgroundCheck.refresh();
            });
        }
    };
})


/**
 * This let's us detect whether we need light text or dark text
 * Enhances readability when placed on dynamic background images
 **/
.directive('preloadedimage', function( $rootScope, $timeout ){
    return {
		restrict: 'E',
		scope: {
			url: '@',
			useproxy: '@',
			detectbackground: '@',
			opacity: '@'
		},
        link: function($scope, $element, $attrs){
			var fullUrl = '';
			if( $scope.useproxy )
				fullUrl += '/vendor/resource-proxy.php?url=';
			fullUrl += $scope.url;
			
			var image = $('<img src="'+fullUrl+'" />');		
			image.load(function(){
				$element.attr('style', 'background-image: url("'+fullUrl+'");');
				var destinationOpacity = 1;
				if( $scope.opacity )
					destinationOpacity = $scope.opacity;
					
				$element.animate(
					{
						opacity: $scope.opacity
					},
					200
				);
				
				// only broadcast to detect background if required (otherwise "href not defined" error)
				if( $scope.detectbackground ){
					// wait for 100ms (ie image half loaded), then check colours
					$timeout( function(){
						$rootScope.$broadcast('spotmop:detectBackgroundColor');
					}, 100);
				}
			});
        },
		template: ''
    };
})



/* ======================================================================== FILTERS =========== */
/* ============================================================================================ */

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

// get the appropriate sized image
.filter('thumbnailImage', function(){
	return function( images ){
        
        // what if there are no images? then nada
        if( images.length <= 0 )
            return false;
        
        // loop all the images
        for( var i = 0; i < images.length; i++){
            var image = images[i];
            
            // this is our preferred size
            if( image.height >= 200 && image.height <= 300 ){
                return image.url;
            
            // let's take it a notch up then
            }else if( image.height > 300 && image.height <= 500 ){
                return image.url;
            
            // nope? let's take it a notch down then
            }else if( image.height >= 150 && image.height < 200 ){
                return image.url;
            }
        };
        
        // no thumbnail that suits? just get the first (and highest res) one then        
		return images[0].url;
	}
})


.run( function($rootScope, SettingsService){
	// this code is run before any controllers
})


/* ==================================================================== APP CONTROLLER ======== */
/* ============================================================================================ */

/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $state, $localStorage, $timeout, $location, SpotifyService, MopidyService, EchonestService, PlayerService, SettingsService ){		
		
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
	$rootScope.requestsLoading = 0;
	$scope.state = PlayerService.state;
	$scope.currentTracklist = [];
	$scope.spotifyUser = {};
	$scope.menuCollapsable = false;
	$scope.reloadApp = function(){
		window.location.reload();
	}
    $scope.playlistsMenu = [];
    $scope.myPlaylists = {};
    
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
	
	// breadcrumbs
	$scope.breadcrumbs = [
		{
			link: '/',
			name: 'Home'
		}
	];
	
	
	/**
	 * Detect if we've just loaded a new version and prompt user to clear cache
	 **/
	var currentVersion = SettingsService.getSetting('version',null);	
	SettingsService.getVersion()
		.success( function(response){
			if( !currentVersion || currentVersion != response.versionCode ){
				SettingsService.setSetting('version',response.versionCode)
				$scope.$broadcast('spotmop:notifyUser', {id: 'updated', message: 'Spotmop has been updated - please clear your browser cache', autoremove: 5000});
			}
		});
		
    
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
	
    angular.element(window).resize(function(){
		
		// detect if the width has changed 
		// we only check width because soft keyboard reveal shouldn't hide/show the menu (ie search form)
		if( $(document).width() != $scope.windowWidth ){
			
			// update stored value
			$scope.windowWidth = $(document).width();
			
			// re-hide the sidebar and reset the body sliding
			$(document).find('body').removeClass('menu-revealed');
		}
    });
	
	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
		$scope.hideMenu();
		BackgroundCheck.refresh();
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
		$state.go( 'search', { query: query } );
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
	
	// when playback finishes, log this to EchoNest (if enabled)
	// this is not in PlayerController as there may be multiple instances at any given time which results in duplicated entries
	$rootScope.$on('mopidy:event:trackPlaybackEnded', function( event, tlTrack ){
		if( SettingsService.getSetting('echonestenabled',false) )
			EchonestService.addToTasteProfile( 'play', tlTrack.tl_track.track.uri );
	});
	
    
    /** 
     * User notifications
     * Displays a user-friendly notification. Can be error, loader or tip
     **/
	$scope.$on('spotmop:notifyUser', function( event, data ){
		
		// handle undefined errors
        if( typeof(data.type) === 'undefined' )
            data.type = '';
		
		// if we're a keyboard shortcut notification, this requires icon injection
		if( data.type == 'keyboard-shortcut' ){
			data.message = '<i class="fa fa-'+data.icon+'"></i>';
		}
		
		// default to autoremove
        if( typeof(data.autoremove) === 'undefined' )
            data.autoremove = true;
		
		// remove any existing notifications of this type (using notification id)
		$(document).find('#notifications .notification-item[data-id="'+data.id+'"]').remove();;
		
		var container = $(document).find('#notifications');
		var notification = '<div class="notification-item '+data.type+'" data-id="'+data.id+'">'+data.message+'</div>';
		container.append( notification );
		notification = $(document).find('#notifications .notification-item[data-id="'+data.id+'"]');
		
		if( data.autoremove ){
			$timeout(
				function(){
					notification.fadeOut(200, function(){ notification.remove() } );
				},
				2500
			);
		}
	});
    
    

    /**
     * All systems go!
     *
     * Without this sucker, we have no operational services. This is the ignition sequence.
     * We use $timeout to delay start until $digest is completed
     **/
	$timeout(
		function(){
			MopidyService.start();
			if(SettingsService.getSetting('echonestenabled',false))
                EchonestService.start();
		},0
	);
    
    
	// watch for re-authorizations of spotify
	$scope.$watch(
		function(){
			return $localStorage.spotify;
		},
		function(newVal,oldVal){
			getSpotifyAccount();
		}
	);
    
    // figure out who we are on Spotify
    // TODO: Hold back on this to make sure we're authorized
	
	getSpotifyAccount();
	
	function getSpotifyAccount(){
		SpotifyService.getMe()
			.then( function(response){
				$scope.spotifyUser = response;
				
				if( typeof(response.error) !== 'undefined' ){
					$scope.$broadcast('spotmop:notifyUser', {type: 'error', message: response.error.message});
				}else{
					$rootScope.spotifyOnline = true;
				
					// save user to settings
					SettingsService.setSetting('spotifyuserid', $scope.spotifyUser.id);
					
					// update my playlists
					$scope.updatePlaylists();
				}
			});
	}
	
	
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
	$(document).on('mouseup', 'body', function( evt ){
		
		// if we've clicked OUTSIDE of a tracklist, let's kill the context menu
		// clicking INSIDE the tracklist is handled by the track/tltrack directives
		if( $(evt.target).closest('.tracklist').length <= 0 ){
			$rootScope.$broadcast('spotmop:hideContextMenu');
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
				
                    $rootScope.requestsLoading++;
			
					if( uris.length > 10 ){
						$scope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-queue', message: 'Adding '+uris.length+' track(s) to queue... this could take some time'});
					}
                    
					MopidyService.addToTrackList( uris ).then( function(response){
                        $rootScope.requestsLoading--;
                        $scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-queue'});
                    });
					
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

                // setup the tracer, and make him sticky
                dragTracer
                    .show()
                    .css({
                        top: event.clientY-10,
                        left: event.clientX+10
                    });
                
                $(document).find('.droppable').removeClass('dropping');
                $(document).find('.dropping-within').removeClass('dropping-within');
			
				var isMenuItem = false;
				if( target && target.closest('.main-menu').length > 0 )
					isMenuItem = true;
				
                if( target && isMenuItem && target.attr('data-type') === 'queue' ){
                    dragTracer.addClass('good').html('Add to queue');
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'library' ){
                    dragTracer.addClass('good').html('Add to library');
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'playlists' ){
                    dragTracer.addClass('good').html('Add to playlist');
                    target.closest('.menu-item.playlists').addClass('dropping-within');
                    target.addClass('dropping');
                }else if( target && isMenuItem && target.attr('data-type') === 'playlist' ){
                    dragTracer.addClass('good').html('Add to playlist');
                    target.addClass('dropping');
                    target.closest('.menu-item.playlists').addClass('dropping-within');
                }else{
                    dragTracer.removeClass('good').html('Dragging '+dragging.tracks.length+' track(s)');
                }
			}
		}
	});
	
});






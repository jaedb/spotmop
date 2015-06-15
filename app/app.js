

/* =========================================================================== INIT =========== */
/* ============================================================================================ */

// create our application
angular.module('spotmop', [
	
	'ngResource',
	'ngStorage',
	'ui.router',
	
	'spotmop.player',
    
	'spotmop.services.settings',
	'spotmop.services.spotify',
	'spotmop.services.mopidy',
	'spotmop.services.echonest',
	
	'spotmop.queue',
	'spotmop.settings',
	'spotmop.playlists',
	'spotmop.search',
	
	'spotmop.browse',
	'spotmop.browse.artist',
	'spotmop.browse.album',
	'spotmop.browse.playlist',
    'spotmop.browse.user',
	'spotmop.browse.tracklist',
	
	'spotmop.discover',
	'spotmop.discover.featured',
	'spotmop.discover.new'
])

.config(function($stateProvider, $locationProvider, $urlRouterProvider){
	$locationProvider.html5Mode(true)
	$urlRouterProvider.otherwise("/queue");
})




/* ======================================================================== DIRECTIVES ======== */
/* ============================================================================================ */

.directive('ngDialog', function() {
	return {
		restrict: 'E',
		scope: {
			show: '='
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		link: function(scope, element, attrs){
			scope.dialogStyle = {};
			scope.hideModal = function(){
				scope.show = false;
			};
		},
		template: '/app/common/dialog.template.html'
	};
})

.directive('thumbnail', function() {
	return {
		restrict: 'E',
		scope: {
			images: '='
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		link: function($scope, $element, $attrs){
			
			// fetch this instance's best thumbnail
			$scope.image = getThumbnailImage( $scope.images );
			
			// get the best thumbnail image, please and thankyou
			function getThumbnailImage( images ){
				
				// what if there are no images? then nada
				if( images.length <= 0 )
					return false;

				// loop all the images
				for( var i = 0; i < images.length; i++){
					var image = images[i];

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
				};

				// no thumbnail that suits? just get the first (and highest res) one then        
				return images[0];
			}
			
		},
		template: '<div><div class="image animate" style="background-image: url({{ image.url }});" ng-show="image"></div><div class="image animate placeholder" ng-show="!image"></div></div>'
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



/* ==================================================================== APP CONTROLLER ======== */
/* ============================================================================================ */

/**
 * Global controller
 **/
.controller('ApplicationController', function ApplicationController( $scope, $rootScope, $state, $localStorage, $timeout, $location, SpotifyService, MopidyService, EchonestService, SettingsService ){
	
    angular.element(window).resize(function () {
        $scope.resquarePanels();
    });

	$scope.currentTlTrack = {};
	$scope.currentTracklist = [];
	$scope.spotifyUser = {};
	$scope.reloadApp = function(){
		window.location.reload();
	}
	// make all the square panels really square
	$scope.resquarePanels = function(){
		$(document).find('.square-panel').each( function(index, value){
			var realWidth = value.getBoundingClientRect().width;
			$(value).find('.image-container').css('height', realWidth +'px');
		});
	}
    
	/**
	 * Search
	 **/
	$scope.searchSubmit = function( query ){
		$state.go( 'search', { query: query } );
	};

	
	/**
	 * Playlists sidebar menus
	 **/
	$scope.playlists = [];
	var getPlaylists = function(){
		return $scope.playlists;
	};
	var setPlaylists = function( playlists ){
		$scope.playlists = playlists;
	};
	
	
	/**
	 * Build main menu
	 **/
	$scope.mainMenu = [
		{
			Title: 'Queue',
			Link: '/queue',
			Icon: 'list',
			Type: 'queue',
			Droppable: true
		},
		{
			Title: 'Discover',
			Link: '/discover/browse',
			Icon: 'star',
			Children: [
				{ 
					Title: 'Featured playlists',
					Link: '/discover/featured'
				},
				{ 
					Title: 'New releases',
					Link: '/discover/new'
				}
			]
		},
		{
			Title: 'Playlists',
			Link: '/playlists',
			Icon: 'folder-open',
			Children: null
		},
		{
			Title: 'Settings',
			Link: '/settings',
			Icon: 'cog'
		}
	];

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
	
	$scope.$on('spotmop:notifyUser', function( event, data ){
        
        if( typeof(data.type) === 'undefined' )
            data.type = '';
        
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
	
	$scope.$on('spotmop:notifyUserRemoval', function( event, data ){
        var notificationItem = $(document).find('#notifications .notification-item[data-id="'+data.id+'"]');
		notificationItem.fadeOut(200, function(){ notificationItem.remove() });
	});
	
	// the page content has been updated
	$scope.$on('spotmop:pageUpdated', function(){
		
		// wait for $digest
		$timeout( function(){
			$scope.resquarePanels();
		},
		0);
	});
		
	// let's kickstart this beast
	// we use $timeout to delay start until $digest is completed
	$timeout(
		function(){
			MopidyService.start();
			if(SettingsService.getSetting('echonestenabled',false))
                EchonestService.start();
		},0
	);
    
    // figure out who we are on Spotify
    // TODO: Hold back on this to make sure we're authorized
    SpotifyService.getMe()
        .success( function(response){
            $scope.spotifyUser = response;
			$rootScope.spotifyOnline = true;
        
            // save user to settings
            SettingsService.setSetting('spotifyuserid', $scope.spotifyUser.id);

            // now get my playlists
            SpotifyService.getPlaylists( $scope.spotifyUser.id )
                .success(function( response ) {

                    var sanitizedPlaylists = [];

                    // loop all of our playlists, and set up a menu item for each
                    $.each( response.items, function( key, playlist ){

                        // we only want to add playlists that this user owns
                        if( playlist.owner.id == $scope.spotifyUser.id ){
                            sanitizedPlaylists.push({
                                Title: playlist.name,
                                Link: '/browse/playlist/'+playlist.uri,
                                Type: 'playlist',
                                Playlist: playlist,
                                Droppable: true
                            });
                        }
                    });

                    // now loop the main menu to find our Playlist menu item
                    for(var i in $scope.mainMenu ){
                        if( $scope.mainMenu[i].Link == '/playlists'){
                            // inject our new menu children
                            $scope.mainMenu[i].Children = sanitizedPlaylists;
                            break; //Stop this loop, we found it!
                        }
                    }
                })
                .error(function( error ){
                    $scope.status = 'Unable to load your playlists';
                });
        })
        .error(function( error ){
            $scope.status = 'Unable to look you up';
			$rootScope.spotifyOnline = false;
        });
	
	
	/**
	 * Delete key pressed
	 * TODO: Figure out a way to integrate this into TracklistController
	 **/
	
	$('body').bind('keyup',function(evt){
        
        // delete key
		if( evt.which === 46 )
			deleteKeyReleased();
        
        // esc key
		if( evt.which === 27 ){
			if( dragging ){
                dragging = false;
                $(document).find('.drag-tracer').hide();
            }
        }
	});
	
	// not in tracklistcontroller because multiple tracklists are stored in memory at any given time
	function deleteKeyReleased(){
		
		var tracksDOM = $(document).find('.track.selected');
		var tracks = [];
		
		// --- DELETE FROM PLAYLIST --- //
		
		if( $state.current.controller == 'PlaylistController' ){
			
			// TODO: add check of userid. We want to disallow deletes if the playlist owner.id
			// does not match the logged in user.id. Currently we just get an error from SpotifyService
			
			// construct each track into a json object to delete
			$.each( $(document).find('.track'), function(trackKey, track){
				if( $(track).hasClass('selected') ){
					tracks.push( {uri: $(track).attr('data-uri'), positions: [trackKey]} );
				}
			});
			
			// parse these uris to spotify and delete these tracks
			SpotifyService.deleteTracksFromPlaylist( $routeParams.uri, tracks )
				.success(function( response ) {
					tracksDOM.remove();
				})
				.error(function( error ){
					console.log( error );
				});
		
			
		// --- DELETE FROM QUEUE --- //
			
		}else if( $state.current.controller == 'QueueController' ){
		
			// fetch each tlid and put into delete array
			$.each( $(document).find('.track.selected'), function(trackKey, track){
				tracks.push( parseInt($(track).attr('data-tlid')) );
			});
			
			MopidyService.removeFromTrackList( tracks );
		}
	}
    
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
	
	// when the mouse id pressed down on a .track
	$(document).on('mousedown', '.track', function(event){
	
		// get the .track row in question
		var track = $(event.currentTarget);
		if( !track.hasClass('track') )
			track = track.closest('.track');
	
		// get the sibling selected tracks too
		var tracks = track.siblings('.selected').andSelf();
		
		// create an object that gives us all the info we need
		dragging = {
					safetyOff: false,			// we switch this when we're outside of the dragThreshold
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
				if( target.attr('data-type') === 'queue' ){
				    
                    $scope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-queue', message: 'Adding to queue'});
                    
					MopidyService.addToTrackList( uris ).then( function(response){
                        $scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-queue'});
                    });
					
				// dropping on playlist
				}else if( target.attr('data-type') === 'playlist' ){
				    
                    $scope.$broadcast('spotmop:notifyUser', {type: 'loading', id: 'adding-to-playlist', message: 'Adding to playlist'});
				
					SpotifyService.addTracksToPlaylist( target.attr('data-uri'), uris )
                        .success( function(response){
                            $scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-playlist'});
                        })
                        .error( function(response){
                            $scope.$broadcast('spotmop:notifyUser', {type: 'error', id: 'adding-to-playlist-error', message: 'Error!'});
                            $scope.$broadcast('spotmop:notifyUserRemoval', {id: 'adding-to-playlist'});
                        });		
					
				// dropping within tracklist
				}else if( track ){
                    
                    var start = 1000;
                    var end = 0;
                    var to_position = $(track).index();
                    $.each(dragging.tracks, function(key, track){
                        if( $(track).index() < start )  
                            start = $(track).index();
                        if( $(track).index() > end )  
                            end = $(track).index();
                    });
                    
                    // sorting queue tracklist
                    if( track.closest('.tracklist').hasClass('queue-items') ){
                        MopidyService.moveTlTracks( start, end, to_position );
                        
                    // sorting playlist tracklist
                    }else if( track.closest('.tracklist').hasClass('playlist-items') ){
                        var playlisturi = $route.current.params.uri;
                        var range_length = 1;
                        if( end > start ) range_length = end - start;
                        SpotifyService.movePlaylistTracks( playlisturi, start, range_length, to_position );
                        $(dragging.tracks).insertBefore( track );
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
                
                if( target && target.attr('data-type') === 'queue' ){
                    dragTracer.addClass('good').html('Add to queue');
                    target.addClass('dropping');
                }else if( target && target.attr('data-type') === 'playlist' ){
                    dragTracer.addClass('good').html('Add to playlist');
                    target.addClass('dropping');
                }else{
                    dragTracer.removeClass('good').html('Dragging '+dragging.tracks.length+' track(s)');
                }
			}
		}
	});
	
});






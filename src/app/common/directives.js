
// create our application
angular.module('spotmop.directives', [])


/* ============================================================ CONFIG FOR 3rd PARTIES ======== */
/* ============================================================================================ */

.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider){

	// wait 250ms before showing loader
	cfpLoadingBarProvider.latencyThreshold = 250;
}])
  
  


/* ======================================================================== DIRECTIVES ======== */
/* ============================================================================================ */

/**
 * Smarter click
 * Fixes issue with ngClick where on touch devices events were triggered twice
 * Use exactly the same as ngClick but attribute is "singleclick" instead
 **/
.directive('singleclick', function() {
    return function($scope, $element, $attrs) {
       $element.bind('touchstart click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            $scope.$apply($attrs['singleclick']);
        });
    };
})


/**
 * Draggable objects
 * Facilitates dragging of tracks, albums, artists and so on
 * Handles the drag and also the drop follow-on functions
 **/
.directive('candrag', function( $rootScope, $filter, MopidyService, SpotifyService, NotifyService, PlayerService ){
	return {
		restrict: 'A',
        scope: {
            dragobj: '='
        },
		link: function($scope, $element, $attrs){
            
            var tracer = $(document).find('.drag-tracer');
            var drag = {
                threshold: 30,
                dragStarted: false,
                dragActive: false,
                startX: false,
                starY: false
            };
			
			
			/** 
			 * Event functions
			 **/
            
            // a click marks the start of a potential drag event, log some initial states
            $element.on('mousedown', function(event){
                drag.dragStarted = true;
                drag.startX = event.clientX;
                drag.startY = event.clientY;
				drag.domobj = event.currentTarget;
				
				// also, if we're dragging a mopidy track item, copy the model to our .type standard container
				if( typeof($scope.dragobj.__model__) !== 'undefined' && typeof($scope.dragobj.type) === 'undefined' ){
					$scope.dragobj.type = $scope.dragobj.__model__.toLowerCase();
				}
            });
            
            // release the mouse (anywhere in the document)
            // we stop any [potential] drag event and handle the drop event
            $(document).on('mouseup', function(event){
                
                // if we've been dragging, handle a drop event
                if( drag.dragActive ) dropping( event );
                
                // reset our drag handlers
                drag.dragStarted = false;
                drag.dragActive = false;
                drag.startX = false;
                drag.startY = false;
				drag.domobj = false;
            });
	
            // move the mouse, check if we're dragging
            $(document).on('mousemove', function(event){
                if( drag.dragStarted ){

                    var left = drag.startX - drag.threshold;
                    var right = drag.startX + drag.threshold;
                    var top = drag.startY - drag.threshold;
                    var bottom = drag.startY + drag.threshold;

                    // check the threshold distance from drag start and now
                    if( event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom ){
                        dragging( event );
                    }
                }
            });
            
            // fired when we are dragging (and throughout the drag motion)
            function dragging( event ){
					
				// trigger our global switch (so nothing else interferes with our mouseup/down events)
				$rootScope.dragging = true;
				
				// make sure the drag target is selected (important for track items)
				$scope.dragobj.selected = true;
                
                // detect if we've just started dragging and need to setup the drag tracer
                var requiresSetup = false;
                if( !drag.dragActive ) requiresSetup = true;
                
                // turn on our drag active switch
                drag.dragActive = true;
				
				// if we've previously been able to drop on something, it's now irrelevant as we've moved the mouse
				$(document).find('.dropping').removeClass('dropping');
				$(document).find('.dropping-within').removeClass('dropping-within');
                
                // if we need initial setup of the tracer, do it darryl
                if( requiresSetup ){
				
                    $('body').addClass('dragging');
                    
					var tracerContent = '';
                    
                            console.log($scope.dragobj);
					if(
						$scope.dragobj.type == 'album' ||
						$scope.dragobj.type == 'localalbum' ||
						$scope.dragobj.type == 'artist' ||
						$scope.dragobj.type == 'localartist' ||
						$scope.dragobj.type == 'playlist' ){
							
							// figure out if we need to apply the sizing filter or if it's already applied
							var images = false;							
							if( typeof($scope.dragobj.images.small) !== 'undefined' ){
								var images = $scope.dragobj.images;
							}else if( $scope.dragobj.images.length > 0 ){
								var images = $filter('sizedImages')( $scope.dragobj.images );
							}
							
							// if we got some images, plug in a purrty thumbnail
							if( images ){
								tracerContent = '<div class="thumbnail" style="background-image: url('+images.small+');"></div>';
							}
							
							tracerContent += '<div class="text">'+$scope.dragobj.name+'</div>';
							
					}else if(
						$scope.dragobj.type == 'track' ||
						$scope.dragobj.type == 'tltrack' ||
						$scope.dragobj.type == 'localtrack' ){
							
							// add the dragobj title first
							// this allows for non-selected tracks to facilitate dragging
							tracerContent += '<div class="track-title">'+ $scope.dragobj.name +'</div>';
							
							// loop the first three items, and add these to our drag tracer
							var selectedTracks = $(document).find('.track.selected');
							for( var i = 0; i < selectedTracks.length && i < 3; i ++ ){
								tracerContent += '<div class="track-title">'+selectedTracks.eq(i).find('.title').html()+'</div>';
							}
						
					}
					
                    tracer.html( tracerContent );
                    tracer.show();
					
					// hide/show the relevant dropzones that accept this type of object
					$.each( $(document).find('#dropzones > .dropzone'), function(index, zone){
						if( targetAcceptsType( $(zone) ) ){
							$(zone).removeClass('disabled');
						}else{
							$(zone).addClass('disabled');
						}
					});
				}
                
                // make our tracker sticky icky
                tracer.css({
                        left: event.clientX,
                        top: event.clientY
                    });
					
				// check to see if what we're hovering accepts what we're dragging				
				var dropTarget = getDropTarget( event );
				var accepts = targetAcceptsType( dropTarget );
				if( accepts ){
					dropTarget.addClass('dropping');
					
					// if we're dropping on a track, add the dropping class to it too
					// this allows us to style the drop location for Chrome that doesn't listen for :hover
					var trackDroppingOn = $(event.target);
					if( !trackDroppingOn.hasClass('track') ) trackDroppingOn = trackDroppingOn.closest('.track');
					if( trackDroppingOn.hasClass('track') ){
						trackDroppingOn.addClass('dropping');
					}
					
					// dropping on nested dropzone (ie playlist dropzone)
					dropTarget.parent().closest('.droppable').addClass('dropping-within');
				}				
            }
            
            // fired when the drop is initiated
            function dropping( event ){
                
                $rootScope.$broadcast('spotmop:contextMenu:hide');
                
                tracer.fadeOut('medium');
				$('body').removeClass('dragging');
				$(document).find('.dropping').removeClass('dropping');
				
				var dropTarget = getDropTarget( event );
				var accepts = targetAcceptsType( dropTarget );
				
				// our drop target accepts our dragging object! 
				if( accepts ){
					switch( dropTarget.attr('droptype') ){
						case 'queue':
							addObjectToQueue();
							break;
						case 'queuenext':
							var at_position = PlayerService.state().currentTracklistPosition();
							addObjectToQueue( at_position );
							break;
						case 'playlist':
							addObjectToPlaylist( event );
							break;
						case 'library':		
							if( $scope.dragobj.type == 'track' ){
								addObjectToTrackLibrary();
							}else if( $scope.dragobj.type == 'tltrack' ){
								addObjectToTrackLibrary();
							}else if( $scope.dragobj.type == 'album' ){
								addObjectToAlbumLibrary();
							}else if( $scope.dragobj.type == 'artist' ){
								addObjectToArtistLibrary();
							}else if( $scope.dragobj.type == 'playlist' ){
								addObjectToPlaylistLibrary();
							}							
							break;
						case 'queuetracklist':
							sortQueueTracklist( event );
							break;
						case 'playlisttracklist':
							sortPlaylistTracklist( event );
							break;
					}
				}
					
				// release our drag switch
				$rootScope.dragging = false;
            }
			
			
			/** 
			 * Drop behaviours
			 **/
			 
			function addObjectToQueue( at_position ){
			
				if( typeof(at_position) === 'undefined' )
					var at_position = null;
			
				switch( $scope.dragobj.type ){
					case 'album':
						MopidyService.addToTrackList( [ $scope.dragobj.uri ], at_position );
						break;
					case 'localalbum':
						MopidyService.addToTrackList( [ $scope.dragobj.uri ], at_position );
						break;
					case 'playlist':
						MopidyService.addToTrackList( [ $scope.dragobj.uri ], at_position );
						break;
					case 'track':
						var trackUris = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackUris.push( trackDoms.eq(i).attr('data-uri') );
						}
						MopidyService.addToTrackList( trackUris, at_position );
						break;
					case 'localtrack':
						var trackUris = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackUris.push( trackDoms.eq(i).attr('data-uri') );
						}
						MopidyService.addToTrackList( trackUris, at_position );
						break;
				}
			}
			
			function addObjectToPlaylist( dropEvent ){
				var playlistUri = $(dropEvent.target).attr('data-uri');
				switch( $scope.dragobj.type ){
					case 'track':
						$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToPlaylistByUri', playlistUri);
						break;
					case 'tltrack':
						$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToPlaylistByUri', playlistUri);
						break;
					case 'album':
						alert('Not yet implemented');
						break;
				}
			}
			
			function addObjectToAlbumLibrary(){
				switch( $scope.dragobj.type ){
					case 'album':
						SpotifyService.addAlbumsToLibrary( $scope.dragobj.id );
						break;
				}
			}
			
			function addObjectToTrackLibrary(){
				switch( $scope.dragobj.type ){
					case 'album':
						var trackIds = [];
						for( var i = 0; i < $scope.dragobj.tracks.items.length; i++){
							trackIds.push( $scope.dragobj.tracks.items[i].id );
						}
						SpotifyService.addTracksToLibrary( trackIds );
						break;
					case 'track':
						var trackIds = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackIds.push( trackDoms.eq(i).attr('data-id') );
						}
						SpotifyService.addTracksToLibrary( trackIds );
						break;
					case 'tltrack':
						var trackIds = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackIds.push( SpotifyService.getFromUri('trackid',trackDoms.eq(i).attr('data-uri')) );
						}
						SpotifyService.addTracksToLibrary( trackIds );
						break;
				}
			}
			
			function addObjectToArtistLibrary(){
				switch( $scope.dragobj.type ){
					case 'artist':
						SpotifyService.followArtist( $scope.dragobj.uri );
						break;
				}
			}
			
			function addObjectToPlaylistLibrary(){
				SpotifyService.followPlaylist( $scope.dragobj.uri );
			}
			
			function sortQueueTracklist( dropEvent ){
				var trackDroppedOn = $(dropEvent.target);
				if( !trackDroppedOn.hasClass('track') ) trackDroppedOn = trackDroppedOn.closest('.track');
				
				var selectedTracks = $(drag.domobj).closest('.tracklist').find('.track.selected');
				
				var to_position = Number( trackDroppedOn.parent().attr('data-index') );
				var start = Number( selectedTracks.first().parent().attr('data-index') );
				var end = Number( selectedTracks.last().parent().attr('data-index') ) + 1;
				
				// if we're dragging down the list, we need to account for the tracks we're moving
				if( to_position > end ){
					to_position = to_position - selectedTracks.length;
				}
				
				MopidyService.moveTlTracks( start, end, to_position );
			}
			
			function sortPlaylistTracklist( dropEvent ){
				var trackDroppedOn = $(dropEvent.target);
				if( !trackDroppedOn.hasClass('track') ) trackDroppedOn = trackDroppedOn.closest('.track');
				
				var selectedTracks = $(drag.domobj).closest('.tracklist').find('.track.selected');
				var playlisturi = trackDroppedOn.closest('.tracklist').attr('playlisturi');
				
				var to_position = Number( trackDroppedOn.parent().attr('data-index') );
				var range_start = Number( selectedTracks.first().parent().attr('data-index') );
				var range_length = Number( selectedTracks.length );
				
				$rootScope.$broadcast('spotmop:playlist:reorder', range_start, range_length, to_position);
			}
			
			
			/**
			 * Utility functions
			 **/
			 
			function getDropTarget( event ){
			
				var dropTarget = $(event.target);
				if( !dropTarget.hasClass('droppable') ) dropTarget = dropTarget.closest('.droppable');
				
				if( dropTarget )
					return dropTarget;
					
				return false;
			}
			
			function targetAcceptsType( dropTarget ){
				
				// get our accepts attribute, and bail if not found
				var accepts = dropTarget.attr('dropaccept');
				if( !accepts ) return false;
				
				// convert attribute string to an array object
				accepts = JSON.parse(accepts);
				
				// run the check
				if( accepts.indexOf( $scope.dragobj.type ) >= 0 )
					return true;
				
				return false;
			}
        }
    }
})


/** 
 * Switch input field
 * Provides toggles for values
 **/
.directive('switch', function( $rootScope, SettingsService ){
	return {
		restrict: 'E',
		scope: {
			name: '@',
			label: '@',
			value: '='
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		controller: function($scope, $element, $attrs){
		
			// listen for click events
			$element.bind('touchstart click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				$scope.$apply( function(){
					$scope.value = !$scope.value;
					$rootScope.$broadcast('spotmop:settings:changed', {name: $scope.name, value: $scope.value});
				});
			});
		},
		template: '<span class="switch-button" ng-class="{ on: value }"><span class="switch-track"><span class="indicator animate"></span></span><span class="label" ng-if="label" ng-bind="label"></span></span>'
	}
})


/** 
 * Artist list
 * Converts an array of artists into a clickable, human-friendly sentence
 **/
.directive('artistlist', function( $rootScope, SettingsService ){
	return {
		restrict: 'E',
		scope: {
			artists: '='
		},
		link: function($scope, $element, $attrs){
			$scope.nolinks = $attrs.hasOwnProperty('nolinks');
			$scope.sentence = $attrs.hasOwnProperty('sentence');
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		templateUrl: 'app/common/artistlist.template.html'
	}
})


/** 
 * Genre list
 * Converts an array of artists into a clickable, human-friendly sentence
 **/
.directive('genrelist', function( $rootScope, SettingsService ){
	return {
		restrict: 'E',
		scope: {
			genres: '='
		},
		link: function($scope, $element, $attrs){
			$scope.sentence = $attrs.hasOwnProperty('sentence');
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		templateUrl: 'app/common/genrelist.template.html'
	}
})
		
		
		
/** 
 * Thumbnail image
 * Figure out the best image to use for this set of image sizes
 * @return image obj
 **/
.directive('thumbnail', function( $timeout, $http, $filter ){
	return {
		restrict: 'E',
		scope: {
			images: '=',
			size: '@',
			debugging: '@'
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		link: function($scope, $element, $attrs){
			
			// load thumbnail on init
			loadThumbnail();
			
			// listen for changes to our image array and update when necessary
			$scope.$watch('images', function(oldValue,newValue){
				loadThumbnail();
			});
			
			// perform core functionality
			function loadThumbnail(){
			
				if( !$scope.images ){
					return false;
				}
				
				// fetch this instance's best thumbnail
				var image = $filter('sizedImages')($scope.images);
				
				// if we've been told a specific size (small|medium|large), get it
				if( $scope.size ){
					image = image[$scope.size];
				
				// otherwise just default to the smallest
				}else{
					image = image.small;
				}
				
				// if we have an image
				if( image && image != '' ){
					$http({
						method: 'GET',
						url: image,
						cache: true
						}).success( function(){
						
							// inject to DOM once loaded
							$element.css('background-image', 'url('+image+')' );
						});
				}
			}
			
		},
		template: '<div class="thumbnail-image image animate"></div>'
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
.directive('slider', function($timeout){
    return {
        restrict: 'E',
		scope: {
			items: '='
		},
        link: function( $scope, $element ){
			
			var sliderContent = $element.find('.slides-content');
			var currentSlide = 0;
			var totalSlides = ( $scope.items.length / 5 ) - 1;
			
			$scope.prev = function(){
				if( canSlide('prev') ){
					currentSlide--;
					sliderContent.animate({left: -(currentSlide)*100 +'%'},120);
				}
			}
			$scope.next = function(){
				if( canSlide('next') ){
					currentSlide++;
					sliderContent.animate({left: -(currentSlide)*100 +'%'},120);
				}
			}
			
			function canSlide( direction ){
				if( direction == 'prev' && currentSlide <= 0 ) return false;
				if( direction == 'next' && currentSlide >= totalSlides ) return false;
				return true;
			}
			
			// once we've rendered the slider
            $timeout( function(){
					resizeScroller();
			}, 0);
			
			$(window).resize( function(){
				resizeScroller();
			});
			
			function resizeScroller(){
				var itemHeight = $element.find('.item-container').children().first().height();
				$element.css({height: itemHeight+'px'});
			}
        },
		templateUrl: 'app/common/slider.template.html'
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
			
			// when we're told to watch, we watch for changes in the url param (ie sidebar bg)
			if( $element.attr('watch') ){
				$scope.$watch('url', function(newValue, oldValue) {
					if( newValue ){
						loadImage();
					}else{
						$element.attr('style', 'background-image: none;');
					}
				}, true);
			}
			
			// load image on init
			loadImage();
			
			// run the preloader
			function loadImage(){
			
				var fullUrl = '';
				/*
				RE-BUILD THIS TO USE PYTHON/TORNADO BACKEND
				if( $scope.useproxy )
					fullUrl += '/vendor/resource-proxy.php?url=';
				*/
				fullUrl += $scope.url;
			
				var image = $('<img src="'+fullUrl+'" />');		
				image.load(function(){
				
					$element.attr('style', 'background-image: url("'+fullUrl+'");');
					var destinationOpacity = 1;
					
					if( typeof($scope.opacity) !== 'undefined' )
						destinationOpacity = $scope.opacity;
						
					$element.animate(
						{
							opacity: destinationOpacity
						},
						200
					);
				});
			}
        },
		template: ''
    };
})


/**
 **/
.directive('backgroundparallax', function( $rootScope, $timeout, $interval, $http, $filter ){
    return {
		restrict: 'E',
        terminal: true,
		scope: {
			images: '=',
			image: '@',
			opacity: '@'
		},
        link: function($scope, $element, $attrs){
			
			// when we're destroyed, make sure we drop our animation interval
			// otherwise we get huge memory leaks for old instances of this directive
			$scope.$on(
				"$destroy",
				function handleDestroyEvent() {
					$interval.cancel(animateInterval);
				}
			);
				
			// setup initial variables
			var	state = {
				scrollTop: 0,
				windowWidth: $(window).width(),
				windowHeight: $(window).height()
			};
			var canvasDOM = document.getElementById('backgroundparallax');
			var context = canvasDOM.getContext('2d');
			var url = '';
			
			// if we're using an explicit url, just use that
			if( $scope.image ){
				url = $scope.image;
				
			// we're getting an array of images, so size 'em and get the largest
			}else if( $scope.images ){
				var images = $filter('sizedImages')($scope.images);
				url = images.large;
			}
			var image = {
					width: 0,
					height: 0,
					url: url
				};
			
			// create our new image object (to be plugged into canvas)
			var imageObject = new Image();
			imageObject.src = image.url;
			imageObject.onload = function(){
				
				// load destination opacity from attribute (if specified)
				var destinationOpacity = 1;				
				if( typeof($scope.opacity) !== 'undefined' )
					destinationOpacity = $scope.opacity;
				
				// store the actual image dimensions into our image object
				image.width = imageObject.naturalWidth;
				image.height = imageObject.naturalHeight;
				
				// plug our image into the canvas
				positionArtistBackground( image );
				
				// fade the whole directive in, now that we're positioned and loaded
				$element.animate({ opacity: destinationOpacity }, 500 );
			}
			
			/**
			 * Process the image object, and plug it in to our canvas, in the appropriate place
			 * Also resizes the canvas to fill the parent element
			 * @param image = custom image object
			 **/
			function positionArtistBackground( image ){
				
				// set our canvas dimensions (if necessary)
				var canvasWidth = $element.outerWidth();
				var canvasHeight = $element.outerHeight();
				if( context.canvas.width != canvasWidth || context.canvas.height != canvasHeight ){
					context.canvas.width = canvasWidth;
					context.canvas.height = canvasHeight;
				}
				
				// zoom image to fill canvas, widthwise
				if( image.width < canvasWidth || image.width > canvasWidth ){
					var scale = canvasWidth / image.width;
					image.width = image.width * scale;
					image.height = image.height * scale;
				}
				
				// now check for fill heightwise, and zoom in if necessary
				if( image.height < canvasHeight ){
					var scale = canvasHeight / image.height;
					image.width = image.width * scale;
					image.height = image.height * scale;
				}
				
				// figure out where we want the image to be, based on scroll position
				var percent = Math.round( state.scrollTop / canvasHeight * 100 );
				var position = Math.round( (canvasHeight / 2) * (percent/100) ) - 100;
				
				image.x = ( canvasWidth / 2 ) - ( image.width / 2 );
				image.y = ( ( canvasHeight / 2 ) - ( image.height / 2 ) ) + ( ( percent / 100 ) * 100);
				
				// actually draw the image on the canvas
				context.drawImage(imageObject, image.x, image.y, image.width, image.height);		
			}
			
			// poll for scroll changes
			var animateInterval = $interval(
				function(){	
					window.requestAnimationFrame(function( event ){
						
						var bannerPanel = $(document).find('.intro');
						
						// if we've scrolled or resized
						if(
							state.scrollTop != $(document).scrollTop() ||
							state.windowWidth != $(window).width() || 
							state.windowHeight != $(window).height() ){
								
								// update our state
								state.scrollTop = $(document).scrollTop();
								state.windowWidth = $(window).width();
								state.windowHeight = $(window).height();
								
								var bannerHeight = bannerPanel.outerHeight();

								// and if we're within the bounds of our document
								// this helps prevent us animating when the objects in question are off-screen
								if( state.scrollTop < bannerHeight ){								
									positionArtistBackground( image );
								}
							}
					});
				},
				10
			);
			
        },
		template: '<canvas id="backgroundparallax"></canvas>'
    };
})


/** 
 * Dropdown field
 * Facilitates nicer dropdowns, like the 'view' toggles
 **/
.directive('dropdownfield', function( $rootScope, $filter, SettingsService ){
	return {
		restrict: 'E',
		scope: {
			options: '=',
			settingname: '@',
			togglesettingname: '@',
			iconclass: '@'
		},
		link: function($scope, $element, $attrs){
			
			// make sure we've been given options
			if( !$scope.options || $scope.options.length <= 0 ){
				return false;
			}
			
			// get the value from our settings, and if null, then we use the first available option
			$scope.currentValue = SettingsService.getSetting($scope.settingname);
			$scope.currentOption = function(){
				if( $scope.currentValue ){
					return $filter('filter')( $scope.options, {value: $scope.currentValue} )[0];
				}else{
					return $scope.options[0];
				}
			}
		},
		controller: function($scope, $element, $attrs){
			
			$scope.toggleVisibility = function(){
				$scope.visible = !$scope.visible;
			}
			
			// option selected
			$scope.selectOption = function( option ){
				$scope.currentValue = option.value;
				
				// if we've clicked on an option that we've already selected, and a toggle field
				if( SettingsService.getSetting($scope.settingname) == option.value && $scope.togglesettingname ){
					
					var toggleState = SettingsService.getSetting($scope.togglesettingname);
					SettingsService.setSetting($scope.togglesettingname, !toggleState);
					
				// BAU
				}else{
					SettingsService.setSetting($scope.settingname, option.value);
				}
				$scope.visible = false;
			}
		},
		replace: true,
		transclude: true,
		templateUrl: 'app/common/dropdown-field.template.html'
	}
})



/* ======================================================================== FILTERS =========== */
/* ============================================================================================ */


// facilitates a filter for null/undefined/false values
.filter('splitstring', [function () {
    return function( string, position ){
        var split = string.split(':');
        return split[position];
    };
}])


// facilitates a filter for null/undefined/false values
.filter('nullOrUndefined', [function () {
    return function( items, property ){
        var arrayToReturn = [];
        for (var i = 0; i < items.length; i++){			
			if( typeof(items[i][property]) === 'undefined' || items[i][property] == false )
				arrayToReturn.push(items[i]);
        }
        return arrayToReturn;
    };
}])


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


// replace accented characters with their un-accented counterparts
// Credit: https://gist.github.com/monkeymonk/ccf698e7b71ba22f098a
.filter('stripAccents', function(){
    return function (source) {
        var accent = [
            /[\300-\306]/g, /[\340-\346]/g, // A, a
            /[\310-\313]/g, /[\350-\353]/g, // E, e
            /[\314-\317]/g, /[\354-\357]/g, // I, i
            /[\322-\330]/g, /[\362-\370]/g, // O, o
            /[\331-\334]/g, /[\371-\374]/g, // U, u
            /[\321]/g, /[\361]/g, // N, n
            /[\307]/g, /[\347]/g, // C, c
        ],
        noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];

        for (var i = 0; i < accent.length; i++){
            source = source.replace(accent[i], noaccent[i]);
        }

        return source;
    };
})

// standardize our images into a large/medium/small structure for template usage
.filter('sizedImages', function( SettingsService ){
	return function( images ){
        
        // what if there are no images? then nada
        if( typeof(images) === 'undefined' || images.length <= 0 )
            return false;
			
		var standardised = {};
		
        // loop all the images
        for( var i = 0; i < images.length; i++){
            var image = images[i];
		
			// mopidy-styled images
			if( typeof(image.__model__) !== 'undefined' ){
				
				if( typeof(image.uri) === 'object' )
					image.url = image.uri[0];
				else
					image.url = image.uri;
				
				delete image.uri;
				
				if( image.height ){
					if( image.height >= 650 ){				
						standardised.large = image.url;
					}else if( image.height >= 250 ){
						standardised.medium = image.url;
					}else{		
						standardised.small = image.url;			
					}
				}
				
				if( !standardised.small ) standardised.small = image.url;
				if( !standardised.medium ) standardised.medium = image.url;
				if( !standardised.large ) standardised.large = image.url;
				
			// spotify-styled images
			}else if( typeof(image.height) !== 'undefined' ){
			
				if( image.height ){
					if( image.height >= 650 ){				
						standardised.large = image.url;		
					}else if( image.height >= 300 ){				
						standardised.medium = image.url;		
					}else{
						standardised.small = image.url;
					}
				}
				
				if( !standardised.small ) standardised.small = image.url;
				if( !standardised.medium ) standardised.medium = image.url;
				if( !standardised.large ) standardised.large = image.url;
			
			// lastFM styled images
			}else if( typeof(image['#text']) !== 'undefined' ){
				
				// making sure the image actually exists...
				if( image['#text'] && image['#text'].length > 0 && image.size != '' ){
					
					switch( image.size ){
						case 'mega':
							standardised.large = image['#text'];
							break;
						case 'extralarge':
							standardised.medium = image['#text'];
							if( !standardised.large ) standardised.large = image['#text'];
							break;
						case 'large':
							standardised.small = image['#text'];
							if( !standardised.medium ) standardised.medium = image['#text'];
							if( !standardised.large ) standardised.large = image['#text'];
							break;
						case 'medium':
							standardised.small = image['#text'];
							if( !standardised.medium ) standardised.medium = image['#text'];
							if( !standardised.large ) standardised.large = image['#text'];
							break;
						case 'small':
							standardised.small = image['#text'];
							if( !standardised.medium ) standardised.medium = image['#text'];
							if( !standardised.large ) standardised.large = image['#text'];
							break;
					}
				}
			
			// none of the above, assume mopidy core-styled images
			}else{
				standardised.large = image;
				standardised.medium = image;
				standardised.small = image;
			}
		}
		
		return standardised;
	}
})

// get the appropriate sized image
.filter('shuffle', function(){
	return function( array ){
		var i, j, tmp;
		
		// swap elements in array randomly using Fisher-Yates (aka Knuth) Shuffle
		for ( i = array.length - 1; i > 0; i-- ) { 
			j = Math.floor( Math.random() * (i + 1) );
			tmp = array[i];
			array[i] = array[j];
			array[j] = tmp;
		}
		
		return array;
	}
})

// identify what the asset's origin is (ie spotify, local)
// return string
.filter('assetOrigin', function(){
	return function( uri ){
		if( typeof(uri) === 'undefined' ){
			return false;
		}
		var uriElements = uri.split(':');
		if( uriElements.length <= 0 ){
			return false;
		}
		return uriElements[0];
	}
})

// identify what the asset type is
// we rely on this being the second attribute in a URI (ie origin:type:id)
// return string
.filter('assetType', function(){
	return function( uri ){
		if( typeof(uri) === 'undefined' ){
			return false;
		}
		var uriElements = uri.split(':');
		if( uriElements.length <= 1 ){
			return false;
		}
		return uriElements[1];
	}
})

/**
 * Get the MBID from a URI
 * @return string
**/
.filter('mbid', function(){
	return function( uri ){
		if( typeof(uri) === 'undefined' ){
			return false;
		}
		var start = uri.indexOf(':mbid:') + 6;
		var end = uri.length;
		
		return uri.substr(start, end);
	}
})

/**
 * URLEncoding
 * @return string
 **/
.filter('urlDecode', function(){
    return function(string){
        return decodeURIComponent( string );
    }
});












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
.directive('candrag', function( $rootScope, MopidyService, SpotifyService, NotifyService ){
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
                
                // detect if we've just started dragging and need to setup the drag tracer
                var requiresSetup = false;
                if( !drag.dragActive ) requiresSetup = true;
                
                // turn on our drag active switch
                drag.dragActive = true;
				
				// if we've previously been able to drop on something, it's now irrelevant as we've moved the mouse
				$(document).find('.dropping').removeClass('dropping');
                
                // if we need initial setup of the tracer, do it darryl
                if( requiresSetup ){
				
                    $('body').addClass('dragging');
                    
					var tracerContent = '';
					
					switch( $scope.dragobj.type ){
						
						case 'album':
							var image = $scope.dragobj.images[$scope.dragobj.images.length-1].url;
							var text = $scope.dragobj.name;
							tracerContent = '<div class="thumbnail" style="background-image: url('+image+');"></div>';
							tracerContent += '<div class="text">'+text+'</div>';
							break;
						
						case 'artist':
							var image = $scope.dragobj.images[$scope.dragobj.images.length-1].url;
							var text = $scope.dragobj.name;
							tracerContent = '<div class="thumbnail" style="background-image: url('+image+');"></div>';
							tracerContent += '<div class="text">'+text+'</div>';
							break;
						
						case 'track':
							var selectedTracks = $(document).find('.track.selected');
							for( var i = 0; i < selectedTracks.length && i < 3; i ++ ){
								tracerContent += '<div class="track-title">'+selectedTracks.eq(i).find('.title').html()+'</div>';
							}
							break;
						
						case 'tltrack':
							var selectedTracks = $(document).find('.track.selected');
							for( var i = 0; i < selectedTracks.length && i < 3; i ++ ){
								tracerContent += '<div class="track-title">'+selectedTracks.eq(i).find('.title').html()+'</div>';
							}
							break;
						
						case 'localtrack':
							var selectedTracks = $(document).find('.track.selected');
							for( var i = 0; i < selectedTracks.length && i < 3; i ++ ){
								tracerContent += '<div class="track-title">'+selectedTracks.eq(i).find('.title').html()+'</div>';
							}
							break;
					}
					
                    tracer.html( tracerContent );
                    tracer.show();
                }
                
                // make our tracker sticky icky
                tracer.css({
                        left: event.clientX,
                        top: event.clientY
                    });
					
				// check to see if what we're hovering accepts what we're dragging				
				var dropTarget = getDropTarget( event );
				var accepts = targetAcceptsType( dropTarget );
				if( accepts ) dropTarget.addClass('dropping');
            }
            
            // fired when the drop is initiated
            function dropping( event ){
			
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
						case 'playlist':
							addObjectToPlaylist( event );
							break;
						case 'libraryalbums':
							addObjectToAlbumLibrary();
							break;
						case 'libraryartists':
							addObjectToArtistLibrary();
							break;
						case 'librarytracks':
							addObjectToTrackLibrary();
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
			 
			function addObjectToQueue(){
				switch( $scope.dragobj.type ){
					case 'album':
						var trackUris = [];
						for( var i = 0; i < $scope.dragobj.tracks.items.length; i++){
							trackUris.push( $scope.dragobj.tracks.items[i].uri );
						}
						MopidyService.addToTrackList( trackUris );
						break;
					case 'track':
						var trackUris = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackUris.push( trackDoms.eq(i).attr('data-uri') );
						}
						MopidyService.addToTrackList( trackUris );
						break;
					case 'localtrack':
						var trackUris = [];
						var trackDoms = $(document).find('.track.selected');
						for( var i = 0; i < trackDoms.length; i++){
							trackUris.push( trackDoms.eq(i).attr('data-uri') );
						}
						MopidyService.addToTrackList( trackUris );
						break;
				}
			}
			
			function addObjectToPlaylist( dropEvent ){
				var playlistUri = $(dropEvent.target).attr('data-uri');
				$rootScope.$broadcast('spotmop:tracklist:addSelectedTracksToPlaylistByUri', playlistUri);
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
			name: '@'
		},
		replace: true, // Replace with the template below
		transclude: true, // we want to insert custom content inside the directive
		link: function($scope, $element, $attrs){
			
			var settingElements = $scope.name.split('.');
			var setting = settingElements[0];
			var subsetting = false;
			if( settingElements.length > 1 )
				subsetting = settingElements[1];
			
			$scope.on = SettingsService.getSetting( setting, false, subsetting );
			
			// listen for click events
			$element.bind('touchstart click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				$scope.$apply( function(){
					$scope.on = !$scope.on;
					SettingsService.setSetting( setting, $scope.on, subsetting );
					$rootScope.$broadcast('spotmop:settings:changed', {name: $scope.name, value: $scope.on});
				});
			});
		},
		template: '<span class="switch-button" ng-class="{ on: on }"><span class="switch animate"></span></span>'
	}
})
		
		
		
/** 
 * Thumbnail image
 * Figure out the best image to use for this set of image sizes
 * @return image obj
 **/
.directive('thumbnail', function( $timeout, $http ){
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
			
			// now actually go get the image
			if( $scope.image ){
				$http({
					method: 'GET',
					url: $scope.image.url,
					cache: true
					}).success( function(){
					
						// inject to DOM once loaded
						$element.css('background-image', 'url('+$scope.image.url+')' );
					});
			}
			
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
		template: '<div class="image animate"></div>'
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
			
			// when we're told to watch, we watch for changes in the url param (ie sidebar bg)
			if( $element.attr('watch') ){
				$scope.$watch('url', function(newValue, oldValue) {
					if (newValue)
						loadImage();
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
.directive('backgroundparallax', function( $rootScope, $timeout, $interval, $http ){
    return {
		restrict: 'E',
        terminal: true,
		scope: {
			image: '@',				// object
			useproxy: '@',
			detectbackground: '@',
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
			var	scrollTop = 0;
			var canvasDOM = document.getElementById('backgroundparallax');
			var context = canvasDOM.getContext('2d');
			
			// load our image data from the json string attribute
			var image = $.parseJSON($scope.image);
		
			/*
			REBUILD THIS TO USE TORNADO
			if( $scope.useproxy )
				image.url = '/vendor/resource-proxy.php?url='+image.url;
			*/
			// create our new image object (to be plugged into canvas)
			image.asObject = new Image();
			image.asObject.src = image.url;
			image.asObject.onload = function(){
				
				// load destination opacity from attribute (if specified)
				var destinationOpacity = 1;				
				if( typeof($scope.opacity) !== 'undefined' )
					destinationOpacity = $scope.opacity;
				
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
				var percent = Math.round( scrollTop / canvasHeight * 100 );
				var position = Math.round( (canvasHeight / 2) * (percent/100) ) - 100;
				
				image.x = ( canvasWidth / 2 ) - ( image.width / 2 );
				image.y = ( ( canvasHeight / 2 ) - ( image.height / 2 ) ) + ( ( percent / 100 ) * 100);
				
				// actually draw the image on the canvas
				context.drawImage(image.asObject, image.x, image.y, image.width, image.height);		
			}
			
			// poll for scroll changes
			var animateInterval = $interval(
				function(){	
					window.requestAnimationFrame(function( event ){
						
						var bannerPanel = $(document).find('.intro');
						
						// if we've scrolled
						if( scrollTop != $(document).scrollTop() ){
							scrollTop = $(document).scrollTop();
							
							var bannerHeight = bannerPanel.outerHeight();

							// and if we're within the bounds of our document
							// this helps prevent us animating when the objects in question are off-screen
							if( scrollTop < bannerHeight ){								
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



/* ======================================================================== FILTERS =========== */
/* ============================================================================================ */


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
});











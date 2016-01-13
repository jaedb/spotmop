
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
    return function(scope, element, attrs) {
        element.bind('touchstart click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            scope.$apply(attrs['singleclick']);
        });
    };
})


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
					
						// if we've scrolled
						if( scrollTop != $('.scrolling-panel').scrollTop() ){
							scrollTop = $('.scrolling-panel').scrollTop();
							
							var bannerHeight = $(document).find('.artist-intro').outerHeight();

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











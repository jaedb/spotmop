/**
 * Create a Dialog service 
 *
 * This provides the framework for fullscreen popup dialogs. We have a pre-set selection
 * of the key types of dialog.
 **/
 
angular.module('spotmop.services.dialog', [])


/**
 * Service to facilitate the creation and management of dialogs globally
 **/
.factory("DialogService", ['$rootScope', '$compile', '$interval', '$timeout', function( $rootScope, $compile, $interval, $timeout ){
    
	// setup response object
    return {
		create: function( dialogType, parentScope ){
			
			// prevent undefined errors
			if( typeof(parentScope) === 'undefined' )
				parentScope = false;
			
			if( $('body').children('.dialog').length > 0 ){
				console.log('A dialog already exists...');
				// TODO: handle what to do in this case
			}
			$('body').append($compile('<dialog type="'+dialogType+'" />')( parentScope ));
		},
		remove: function(){
			$('body').children('.dialog').fadeOut( 200, function(){ $(this).remove() } );
		}
	};
}])


/**
 * Directive to handle wrapping functionality
 **/
.directive('dialog', function( $compile ){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: {
			type: '@'
		},
		templateUrl: 'app/services/dialog/template.html',
		link: function( $scope, $element ){
			$element.find('.content').html( $compile('<'+$scope.type+'dialog />')( $scope ) );
		},
		controller: function( $scope, $element, DialogService ){
			
            $scope.closeDialog = function(){
                DialogService.remove();
            }
            
			// listen for <esc> keypress
			$scope.$on('spotmop:keyboardShortcut:esc', function(event){
				DialogService.remove();
			});
		}
	};
})


/**
 * Dialog: Create playlist
 * Allows user to create a playlist
 **/

.directive('createplaylistdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/createplaylist.template.html',
		controller: function( $scope, $element, $rootScope, DialogService, SettingsService, SpotifyService ){
            $scope.saving = false;
			$scope.togglePublic = function(){
				if( $scope.playlistPublic )
					$scope.playlistPublic = false;
				else
					$scope.playlistPublic = true;
			}
            $scope.savePlaylist = function(){
                
                // set state to saving (this swaps save button for spinner)
                $scope.saving = true;
                
                // perform the creation
                SpotifyService.createPlaylist(
						$scope.$parent.spotifyUser.id,
						{ name: $scope.playlistName, public: $scope.playlistPublic } 
					)
                    .then( function(response){
                    
                        // save new playlist to our playlist array
                        $scope.$parent.playlists.unshift( response );
                    
                        // fetch the new playlists (for sidebar)
                        $scope.$parent.updatePlaylists();
                    
                        // and finally remove this dialog
                        DialogService.remove();
    					$rootScope.$broadcast('spotmop:notifyUser', {id: 'saved', message: 'Saved', autoremove: true});
                    });
            }
		}
	};
})


/**
 * Dialog: Edit playlist
 * Allows user to rename and change public state for a playlist
 **/

.directive('editplaylistdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/editplaylist.template.html',
		controller: function( $scope, $element, $rootScope, DialogService, SpotifyService ){
            $scope.playlistNewName = $scope.$parent.playlist.name;
            $scope.playlistNewPublic = $scope.$parent.playlist.public;
            $scope.saving = false;
			$scope.togglePublic = function(){
				if( $scope.playlistNewPublic )
					$scope.playlistNewPublic = false;
				else
					$scope.playlistNewPublic = true;
			}
            $scope.savePlaylist = function(){
                
                // set state to saving (this swaps save button for spinner)
                $scope.saving = true;
                
                // actually perform the rename
                SpotifyService.updatePlaylist( $scope.$parent.playlist.uri, { name: $scope.playlistNewName, public: $scope.playlistNewPublic } )
                    .then( function(response){
                    
                        // update the playlist's name
                        $scope.$parent.playlist.name = $scope.playlistNewName;
                        $scope.$parent.playlist.public = $scope.playlistNewPublic;
                    
                        // fetch the new playlists (for sidebar)
                        $scope.$parent.updatePlaylists();
                    
                        // and finally remove this dialog
                        DialogService.remove();
    					$rootScope.$broadcast('spotmop:notifyUser', {id: 'saved', message: 'Saved', autoremove: true});
                    });
            }
		}
	};
})


/**
 * Dialog: Add tracks to playlist
 * Accepts a list of tracks, and provides a list of playlists that we can add to
 **/

.directive('addtoplaylistdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/addtoplaylist.template.html',
		controller: function( $scope, $element, $rootScope, $filter, DialogService, SpotifyService, SettingsService ){
            
			$scope.playlists = [];
			var spotifyUserID = SettingsService.getSetting('spotifyuserid');
			
			SpotifyService.getPlaylists( spotifyUserID, 50 )
				.then(function( response ) {
					$scope.playlists = $filter('filter')( response.items, { owner: { id: spotifyUserID } } );
				});
			
			/**
			 * When we select the playlist for these tracks
			 **/
			$scope.playlistSelected = function( playlist ){
			
				var selectedTracks = $filter('filter')( $scope.$parent.tracklist.tracks, { selected: true } );				
				var selectedTracksUris = [];
				
				// construct a flat array of track uris
				angular.forEach( selectedTracks, function( track ){
					
					// accommodate TlTrack objects, with their nested track objects
					if( typeof( track.track ) !== 'undefined' )
						selectedTracksUris.push( track.track.uri );
					
					// not TlTrack, so not nested
					else
						selectedTracksUris.push( track.uri );					
				});
				
				// get Spotify involved...
				SpotifyService.addTracksToPlaylist( playlist.uri, selectedTracksUris )
					.then( function(response){
					
						// remove this dialog, and initiate standard notification
						DialogService.remove();
						$rootScope.$broadcast('spotmop:tracklist:unselectAll');
						$scope.$emit('spotmop:notifyUser', {id: 'adding-to-playlist', message: 'Added '+selectedTracksUris.length+' tracks', autoremove: true});
					});
			};
		}
	};
})


/**
 * Dialog: Control volume of Mopidy
 * Facilitates more fiddly controls, useful for touch devices
 **/

.directive('volumecontrolsdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/volumecontrols.template.html',
		controller: function( $scope, $element, $rootScope, $filter, DialogService, PlayerService ){
			$scope.state = function(){
				return PlayerService.state();
			}
			$scope.setVolume = function( event ){
				var slider, offset, position, percent;
				if( $(event.target).hasClass('slider') )
					slider = $(event.target);
				else
					slider = $(event.target).closest('.slider');
				
				// calculate the actual destination seek time
				offset = slider.offset();
				position = event.pageX - offset.left;
				percent = position / slider.innerWidth() * 100;
				percent = parseInt(percent);
				
				PlayerService.setVolume( percent );
			};
		}
	};
})


/**
 * Dialog: Setup new user
 * Initial setup
 **/

.directive('initialsetupdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/initialsetup.template.html',
		controller: function( $scope, $element, $rootScope, $filter, DialogService, SettingsService ){
            $scope.saving = false;
            $scope.save = function(){
                
                // set state to saving (this swaps save button for spinner)
                $scope.saving = true;
                
                // perform the creation
                SettingsService.setUser( $scope.username )
                    .then( function(response){
                        SettingsService.setSetting('client', client);
                        DialogService.remove();
                    });
            }
		}
	};
});









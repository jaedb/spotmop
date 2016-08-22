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
			
			$scope.closeDisabled = false;
			if( $scope.type == 'initialsetup' )
				$scope.closeDisabled = true;
			
            $scope.closeDialog = function(){
                DialogService.remove();
            }
            
			// listen for <esc> keypress
			$scope.$on('spotmop:keyboardShortcut:esc', function(event){
				if( !$scope.closeDisabled )
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
		controller: function( $scope, $element, $rootScope, DialogService, MopidyService, SettingsService, SpotifyService, NotifyService ){
		
			$scope.playlistPublic = 'true';
            $scope.savePlaylist = function(){
				
				if( $scope.playlistName && $scope.playlistName != '' ){
					
					// set state to saving (this swaps save button for spinner)
					$scope.saving = true;
					
					// convert public to boolean (radio buttons use strings...)
					if( $scope.playlistPublic == 'true' )
						$scope.playlistPublic = true;
					else
						$scope.playlistPublic = false;
					
					// spotify playlist
					if( $rootScope.spotifyAuthorized ){
						SpotifyService.createPlaylist(
								$scope.$parent.spotifyUser.id,
								{ name: $scope.playlistName, public: $scope.playlistPublic } 
							)
							.then( function(response){
								
								$scope.saving = false;
								NotifyService.notify('Playlist created');
								
								// save new playlist to our playlist array
								$scope.$parent.playlists.items.push( response );
							
								// now close our dialog
								DialogService.remove();
							});
					
					// local playlist
					}else{
						MopidyService.createPlaylist( $scope.playlistName )
							.then( function( response ){
								
								$scope.saving = false;
								NotifyService.notify('Playlist created');
								
								// save new playlist to our playlist array
								$scope.$parent.playlists.items.push( response );
								
								// now close our dialog
								DialogService.remove();
							});
					}
					
				}else{
					$scope.error = true;
				}
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
            $scope.playlistNewPublic = $scope.$parent.playlist.public.toString();
            $scope.saving = false;
            $scope.savePlaylist = function(){
				
				if( $scope.playlistNewName && $scope.playlistNewName != '' ){
                
					// set state to saving (this swaps save button for spinner)
					$scope.saving = true;
					
					// convert public to boolean (radio buttons use strings...)
					if( $scope.playlistNewPublic == 'true' )
						$scope.playlistNewPublic = true;
					else
						$scope.playlistNewPublic = false;
					
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
						
				}else{
					$scope.error = true;
				}
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
		controller: function( $scope, $element, $rootScope, $filter, DialogService, SpotifyService, SettingsService, NotifyService ){
            
			$scope.playlists = [];
			var spotifyUserID = SettingsService.getSetting('spotifyuser.id');
			
			SpotifyService.getPlaylists( spotifyUserID, 50 )
				.then(function( response ) {
					$scope.playlists = $filter('filter')( response.items, { owner: { id: spotifyUserID } } );
				});
			
			/**
			 * When we select the playlist for these tracks
			 **/
			$scope.playlistSelected = function( playlist ){
			
				var selectedTracks = $filter('filter')( $scope.$parent.tracks, { selected: true } );				
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
						NotifyService.notify( selectedTracksUris.length +' tracks added to '+ playlist.name );
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
		controller: function( $scope, $element, $rootScope, $filter, DialogService, SettingsService, SpotifyService, PusherService ){
			
			$scope.settings = SettingsService.getSettings();
			
			// default to on
			SettingsService.setSetting('spotify.authorizationenabled',true);
			SettingsService.setSetting('keyboardShortcutsEnabled',true);
			SettingsService.setSetting('pointerMode','default');
		
            $scope.saving = false;
            $scope.save = function(){          
				if( $scope.name && $scope.name != '' ){
					
					// set state to saving (this swaps save button for spinner)
					$scope.saving = true;
					
					// unless the user has unchecked spotify authorization, authorize
					if( SettingsService.getSetting('spotify.authorizationenabled') ){
						SpotifyService.authorize();
					}
					
					// perform the creation
					SettingsService.setSetting('pusher.name', $scope.name);
					
					// and go tell the server to update
					PusherService.send({
						type: 'client_updated', 
						data: {
							attribute: 'name',
							oldVal: '',
							newVal: $scope.name
						}
					});
					
					DialogService.remove();
				}else{
					$scope.error = true;
				}
            }
		}
	};
})


/**
 * Dialog: Add asset to the queue by URI
 * Accepts whatever format is provided by the backends (ie spotify: soundcloud: local:)
 **/

.directive('addbyuridialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: 'app/services/dialog/addbyuri.template.html',
		controller: function( $scope, $element, DialogService, SpotifyService, MopidyService ){
				
            $scope.saving = false;
            $scope.add = function(){          
				if( $scope.uri && $scope.uri != '' ){
					
					// set state to saving (this swaps save button for spinner)
					$scope.error = false;
					$scope.saving = true;
					
					MopidyService.addToTrackList( [ $scope.uri ] )
						.catch( function(error){
							$scope.saving = false;
							$scope.error = true;
						})
						.then( function(response){
							if( !$scope.error ){
								DialogService.remove();
							}
						});
				}else{
					$scope.error = true;
				}
            }
		}
	};
});









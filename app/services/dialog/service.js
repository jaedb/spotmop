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
		templateUrl: '/app/services/dialog/template.html',
		link: function( $scope, $element ){
			$element.find('.content').html( $compile('<'+$scope.type+'dialog />')( $scope ) );
		},
		controller: function( $scope, $element, DialogService ){
			
            $scope.closeDialog = function(){
                DialogService.remove();   
            }
            
			// listen for <esc> keypress
			$(document).on('keyup', function(evt){
				if( evt.keyCode == 27 ){
					DialogService.remove();
				}
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
		templateUrl: '/app/services/dialog/createplaylist.template.html',
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
                    .success( function(response){
                    
                        // save new playlist to our playlist array
                        $scope.$parent.playlists.unshift( response );
                    
                        // fetch the new playlists (for sidebar)
                        $scope.$parent.updatePlaylists();
                    
                        // and finally remove this dialog
                        DialogService.remove();
    					$rootScope.$broadcast('spotmop:notifyUser', {id: 'saved', message: 'Saved', autoremove: true});
    					$rootScope.$broadcast('spotmop:pageUpdated');
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
		templateUrl: '/app/services/dialog/editplaylist.template.html',
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
                    .success( function(response){
                    
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
});









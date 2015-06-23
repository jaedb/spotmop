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
 * All the different types of dialogs live below
 **/

.directive('editplaylistdialog', function(){
	
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		templateUrl: '/app/services/dialog/editplaylist.template.html',
		controller: function( $scope, $element, DialogService, SpotifyService ){
            $scope.newPlaylistName = $scope.$parent.playlist.name;
            $scope.saving = false;
            $scope.savePlaylist = function(){
                
                // set state to saving (this swaps save button for spinner)
                $scope.saving = true;
                
                // actually perform the rename
                SpotifyService.updatePlaylist( $scope.$parent.playlist.uri, { name: $scope.newPlaylistName } )
                    .success( function(response){
                    
                        // update the playlist's name
                        $scope.$parent.playlist.name = $scope.newPlaylistName;
                    
                        // fetch the new playlists (for sidebar)
                        $scope.$parent.updatePlaylists();
                    
                        // and finally remove this dialog
                        DialogService.remove();
                    });
            }
		}
	};
});









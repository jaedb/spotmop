'use strict';

angular.module('spotmop.player', [
	'spotmop.services.spotify',
	'spotmop.services.mopidy'
])

.controller('PlayerController', function PlayerController( $scope, $timeout, MopidyService, SpotifyService ){
	
	$scope.currentTrack = {};
	
	// let's kickstart this beast
	// we use $timeout to delay start until $digest is completed. Not 100% sure why we need to do this.
	$timeout(
		function(){ MopidyService.start(); },0
	);
	
	$scope.$on('mopidy:state:online', function(){
		updateCurrentTrack();
	});
	
	$scope.$on('mopidy:event:tracklistChanged', function(){
		updateCurrentTrack();
	});
	
	function updateCurrentTrack(){
		
		MopidyService.getCurrentTrack().then(function(track){
			if(track !== null && track !== undefined){
				if(track.name.indexOf("[loading]") > -1){
					MopidyService.lookup(track.uri).then(function(result){
						updatePlayerInformation(result[0]);
					});
				}else{
					updatePlayerInformation(track);
				}
			}
		});
	};
	
	/**
	 * Update the player with new track object.
	 * Loads graphic, length, title, etc into template vars
	 * @param track Track object
	 **/
	function updatePlayerInformation( track ){
		$scope.currentTrack = track;
		
		// now we have track info, let's get the spotify artwork	
		SpotifyService.getTrack( track.uri )
			.success(function( response ) {
				$scope.currentTrack.album.images = response.album.images;
			})
			.error(function( error ){
				$scope.status = 'Unable to load new releases';
			});
			
	};
	
});
/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Playlists
 *
 */

$(document).ready( function(evt){
	
	setupNewPlaylistButton();
	setupRefreshPlaylistButton();

});


/*
 * Setup functionality on the 'new playlist' button
 * Fires request to API and injects result into sidebar
*/

function setupNewPlaylistButton(){

	$('.new-playlist-button').on('click', function(evt){
		
		var playlistName = prompt("New playlist name");
		
		if( playlistName != null ){
		
			createPlaylist( playlistName ).success( function( playlist ) {
			
				var lists = $('.menu-item-wrapper.playlists .playlist-list');
				coreArray['playlists'] += playlist;
				
				lists.prepend('<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>');
			
				// draggable to drop them onto playlists
				$(document).find('#menu .playlist-list .playlist-item[data-uri="'+playlist.uri+'"]').droppable({
					drop: function(evt, ui){
						addTrackToPlaylist( getIdFromUri( $(evt.target).data('uri') ), $(ui.helper).data('uri') ).success(function(evt){
							notifyUser('good','Track added to playlist');
						});
					}
				});
			});
		};
		
	});

};


/*
 * Setup functionality on the 'refresh playlist' button
 * Retries command to fetch from spotify api
*/

function setupRefreshPlaylistButton(){

	$(document).on('click', '.refresh-playlist-button', function(evt){
		updatePlaylists();
	});

};



/*
 * Update the playlists list on the sidebar
 * Also updates coreArray reference
*/

function updatePlaylists(){
	
	// Get the users playlists and place them in the client
	if( checkToken() ){
		updateLoader('start');
		getMyPlaylists().success( function( playlists ){
			
			var lists = $('.menu-item-wrapper.playlists .playlist-list');
			coreArray['playlists'] = playlists.items;
			
			// clear out the previous playlists
			lists.html('');
			updateLoader('stop');
			
			// loop each playlist
			for( var i = 0; i < playlists.items.length; i++ ){
			
				var playlist = playlists.items[i];
				
				// add list to the playlists bar
				lists.append('<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>');
			}
			
		}).fail( function( response ){
		
			updateLoader('stop');
        	notifyUser('error', 'Error fetching playlists: '+response.responseJSON.error.message);
        	$('#menu .playlist-list').html('<div class="refresh-playlist-button"><i class="fa fa-refresh"></i></div>');
	        
	    });
	};
	
};






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
    
    var readyToLoad = true;
    
    // listen for scroll to bottom, then we can load the additional tracks
    $(window).scroll(function(){
        if( readyToLoad && ( $(window).scrollTop() + $(window).height() > $(document).height() - 40 ) ){
            
            // first, check the token
            $.when( checkToken() ).done( function(){
                
                // if the next link is not null (like it would be if there were no more tracks)                
                if( coreArray['playlistNextTracksLink'] ){
                	
                    readyToLoad = false;

                    updateLoader('start');

                    getFromSpotify( coreArray['playlistNextTracksLink'] ).success(function( tracks ){
                        updateLoader('stop');
                        renderTracksTable( $('.page#playlist .tracks'), tracks.items, null, null, true );
                        coreArray['playlistNextTracksLink'] = tracks.next;
                        readyToLoad = true;
                    });
                    
                }
                
            });
        }
    });

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
		
		// get "my" playlists from Spotify (excludes collaborative due to API limitations)
		updateLoader('start');		
		getMyPlaylists().success( function( playlists ){
			
			var lists = $('.menu-item-wrapper.playlists .playlist-list');
			localStorage.playlists = JSON.stringify( playlists.items );
						
			// clear out the previous playlists
			lists.html('');
			updateLoader('stop');
			
			// loop each playlist
			for( var i = 0; i < playlists.items.length; i++ ){
			
				var playlist = playlists.items[i];
				
				// add list to the playlists bar
				lists.append('<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>');
			}
	    
		    // let's now load the custom playlists
		    // TODO: This is under development and isn't fully supported by Spotify API
		    /*
			if( typeof( localStorage.customPlaylists ) !== 'undefined' && localStorage.customPlaylists !== 'null' ){
				
				var lists = $('.menu-item-wrapper.playlists .playlist-list');
				var customPlaylists = JSON.parse(localStorage.customPlaylists);
				
				$.each( customPlaylists, function(key, playlist){		
					
					// add list to the playlists bar
					lists.append('<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>');				
				});
				
			}
			*/
			
		}).fail( function( response ){
		
			updateLoader('stop');
        	notifyUser('error', 'Error fetching playlists: '+response.responseJSON.error.message);
        	$('#menu .playlist-list').html('<div class="refresh-playlist-button"><i class="fa fa-refresh"></i></div>');
	        
	    });
		
	};
	
};


/*
 * Add an existing playlist
 * Spotify API doesn't permit collaborative playlists, so this is a workaround
 * Uses localStorage to retain playlist info
*/
function AddCustomPlaylist( userID, playlistID ){
	
	updateLoader('start');
	
	// go get the playlist as a spotify object
	getPlaylist( userID, playlistID )
		.success( function( response ){
			updateLoader('stop');
			
			var customPlaylists = [];
			
			if( typeof( localStorage.customPlaylists ) !== 'undefined' && localStorage.customPlaylists !== 'null' ){
				customPlaylists = JSON.parse(localStorage.customPlaylists);
			}
			
			customPlaylists.push( response );
			
			localStorage.customPlaylists = JSON.stringify(customPlaylists);
			
        	notifyUser('good', 'Custom playlist added');
		})
		.fail( function( response ){
			updateLoader('stop');
        	notifyUser('error', 'Error adding custom playlist: '+response.responseJSON.error.message);
		});
	
};






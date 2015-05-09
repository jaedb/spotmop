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
    $('#pages').scroll(function( evt ){
        if( readyToLoad && ( $('#pages').scrollTop() + 40 >= ( $('#pages > .liner').innerHeight() - $('#pages').innerHeight() ) ) ){
            
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
				var playlistButtonHTML = '<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>';
                
				// add list to the playlists bar
                if( playlist.owner['id'] == localStorage.userID ){
				    lists.filter('.owned').append(playlistButtonHTML);
                }else{
				    lists.filter('.following').append(playlistButtonHTML);
                }
			}
	    
		    // let's now load the custom playlists
		    // TODO: This is under development and isn't fully supported by Spotify API
			if( typeof( localStorage.customPlaylists ) !== 'undefined' && localStorage.customPlaylists !== 'null' ){
				
				var lists = $('.menu-item-wrapper.playlists .playlist-list.owned');
				var customPlaylists = JSON.parse(localStorage.customPlaylists);
				
				$.each( customPlaylists, function(key, playlist){		
					console.log(playlist);
					// add list to the playlists bar
					lists.append('<div class="playlist-item child-menu-item" data-uri="'+playlist.uri+'"><a href="#playlist/'+playlist.uri+'">'+playlist.name+'</a></div>');				
				});
				
			}
			
		}).fail( function( response ){
			// DEBUG: for some reason the tablet doesn't fetch a new token when it's been expired?
			// alert(response.responseJSON.code);
			updateLoader('stop');
        	notifyUser('error', 'Error fetching playlists: '+response.responseJSON.error.message);
        	$('#menu .playlist-list').html('<div class="refresh-playlist-button"><i class="fa fa-refresh"></i></div>');
	        
	    });
		
	};
	
};


/**
 * Add an existing playlist
 * Spotify API doesn't permit fetching of collaborative playlists, so this is a workaround
 * Uses localStorage to retain playlist info
 *
 * CURRENTLY IN DEVELOPMENT, POSSIBLY WON'T WORK WITH SPOTIFY API
 **/
function AddCustomPlaylist( userID, playlistID ){
	
	// currently we can only add if we're the owner
	if( userID != localStorage.userID ){		
		notifyUser('error', 'Currently you can only add your own playlists');		
	}else{
	
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

				// add the new playlist to the DOM
				$(document)
					.find('.menu-item-wrapper.playlists .playlist-list.owned')
					.append('<div class="playlist-item child-menu-item" data-uri="'+response.uri+'" data-userid="'+response.owner.id+'"><a href="#playlist/'+response.uri+'">'+response.name+'</a></div>');

				notifyUser('good', 'Custom playlist added');
			})
			.fail( function( response ){
				updateLoader('stop');
				notifyUser('error', 'Error adding custom playlist: '+response.responseJSON.error.message);
			});
	}
};



/**
 * Identify if a playlist is my playlist
 *
 * @param playlist SpotifyApi Playlist object (JSON)
 * @return boolean
 **/
function IsMyPlaylist( playlist ){

	var user = localStorage.userID;
	var owner = playlist.owner.id;
	
	if( user == owner )
		return true;
	
	return false;
}




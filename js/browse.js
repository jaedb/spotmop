/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Browse popular playlists, top tracks
 *
 */

/*
 *
*/

function loadBrowsePage(){
	
	if( !coreArray['browsePageLoaded'] ){
		$.ajax({
			url: '/spotify.php',
			type: "GET",
			success: function(result){
				result = $.parseJSON(result);
				
				var playlists = result.playlists.items;
				
				// empty out previous albums
				$('#explore .playlists').html('').removeClass('hide');
				
				for(var i = 0; i < playlists.length; i++){
					
					var playlist = playlists[i];
					
					imageURL = '';
					if( playlists.length > 0 )
						imageURL = playlist.images[0].url;
					
					$('#explore .playlists').append( '<a class="album-panel" href="#browse/playlist/'+playlist.uri+'" data-uri="'+playlist.uri		+'" 	style="background-image: url('+imageURL+');"><span class="name animate">'+playlist.name+'</span></a>' );
					
				};
				
				coreArray['browsePageLoaded'] = true;
			}
		});
	};
	
};


function browse( context, uri ){
	
	$('#browse .section').addClass('hide');	
	$('#browse .section.'+context).removeClass('hide');
	
	if( context == 'playlist' ){
		
		renderTracksTable( $('#browse .section.'+context), null, uri );
		
	};
	
};













/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Settings
 *
 */


/*
 * Explore an artist, album or playlist
 * @var uri = spotify uri
*/
function explore( type, uri ){
	/*
	// get the id (3rd part of the URI)
	if( typeof uri !== 'undefined' )
		var id = getIdFromUri( uri );
	
	navigateToPage('explore');
    
    coreArray['currentPageSection'] = type;
	
	// clear out all the data
	$('#explore .reset-on-load').html('');
	
	// reveal relevant subpage
	exploreSubpage(type);
		
	if( type == 'album' ){
	
	
	// playlist view
	}else if( type == 'playlist' ){
	
		$('.loader').show();
	
		var userid = uri.split(':')[2];
		var playlistid = uri.split(':')[4];
		
		getPlaylist( userid, playlistid ).success(function( playlist ) {
			$('.loader').fadeOut();
			renderPlaylist( playlist );
		}).fail( function( response ){ $('.loader').fadeOut(); notifyUser('error', 'Error fetching playlist: '+response.responseJSON.error.message ); } );
	}
	*/
};



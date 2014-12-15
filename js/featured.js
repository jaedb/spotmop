/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Browse popular playlists, top tracks
 *
 */


function featured(){
	
	
	/* -------- NEW RELEASES ---- */
	
	// empty out previous albums
	addLoader( $('#featured .albums') );
	
	getNewReleases().then( function(response){
					
		// empty out previous albums
		$('#featured .albums').html('');
		
		// loop each album
		for(var i = 0; i < response.albums.items.length; i++){
		
			var album = response.albums.items[i];
			
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[1].url;
			
			$('#featured .albums').append( '<a class="album-panel" href="#explore/album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
		};
        
        // make them draggable
        $('#featured .albums').find('.album-panel').draggable({
            distance: 30,
            revert: true,
            revertDuration: 0,
            helper: 'clone',
            appendTo: 'body',
            zIndex: 10000
        });

	}).fail( function( response ){ notifyUser('error', 'Error fetching content: '+response.responseJSON.error.message ); } );
	
	
	
	/* ------- FEATURED PLAYLISTS --- */
	
	// drop in the loader
	addLoader( $('#featured .playlists') );

	getFeaturedPlaylists().success(function( playlists ) {
		
		var playlists = playlists.playlists.items;
		
		// empty out previous playlists
		$('#featured .playlists').html('');
		
		for(var i = 0; i < playlists.length; i++){
			
			var playlist = playlists[i];
			
			imageURL = '';
			if( playlists.length > 0 )
				imageURL = playlist.images[0].url;
			
			$('#featured .playlists').append( '<a class="album-panel" href="#explore/playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+playlist.name+'</span></a>' );
			
		};
		
	}).fail( function( response ){ notifyUser('error', 'Error fetching featured playlists: '+response.responseJSON.error.message ); } );
	
};













/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Browse popular playlists, top tracks
 *
 */


function discover( page ){
	
	if( typeof( page ) !== 'undefined' ){
		if( page == 'featured-playlists' )
			renderFeaturedPlaylists();
		else if( page == 'new-releases' )
			renderNewReleases();
	}
	
};

/*
 * Fetch and render new releases
*/
function renderFeaturedPlaylists(){
	
	// drop in the loader
	$('.loader').show();
	$(document).find('#discover .subpage').hide();
	$(document).find('#discover .featured-playlists').show();

	getFeaturedPlaylists().success(function( playlists ) {
		
		var playlists = playlists.playlists.items;
		
		// empty out previous playlists
		$(document).find('#discover .featured-playlists .content').html('');
		$('.loader').fadeOut();
		
		for(var i = 0; i < playlists.length; i++){
			
			var playlist = playlists[i];
			
			imageURL = '';
			if( playlists.length > 0 )
				imageURL = playlist.images[0].url;
			
			$('#discover .featured-playlists .content').append( '<a class="album-panel" href="#explore/playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate hide">'+playlist.name+'</span></a>' );
			
		};
		
	}).fail( function( response ){ $('.loader').fadeOut(); notifyUser('error', 'Error fetching featured playlists: '+response.responseJSON.error.message ); } );
}



/*
 * Fetch and render new releases
*/
function renderNewReleases(){
	
	// empty out previous albums
	$('.loader').show();
	$(document).find('#discover .subpage').hide();
	$(document).find('#discover .new-releases').show();
	
	getNewReleases().then( function(response){
		
		// empty out previous albums
		$(document).find('#discover .new-releases .content').html('');
		$('.loader').fadeOut();
		
		// loop each album
		for(var i = 0; i < response.albums.items.length; i++){
		
			var album = response.albums.items[i];
			
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[1].url;
			
			$('#discover .new-releases .content').append( '<a class="album-panel" href="#explore/album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
		};
		
		// make them draggable
		$('#discover .new-releases .content').find('.album-panel').draggable({
			distance: 30,
			revert: true,
			revertDuration: 0,
			helper: 'clone',
			appendTo: 'body',
			zIndex: 10000
		});
		

	})
	.fail( function( response ){
		$('.loader').fadeOut();
		if( typeof response.responseJSON !== 'undefined' )
			notifyUser('error', 'Error fetching new releases: '+response.responseJSON.error.message );
		else
			notifyUser('error', 'Error fetching new releases, and no error response from API' );
	});
}










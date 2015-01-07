/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz)
 * 
 * Navigate page sections
 *
 */





/*
 * Navigate
*/
function navigate(){

    var hash = window.location.hash;
    hash = hash.replace('#','');
    hash = hash.split('/');
    var page = hash[0];
	coreArray['currentPage'] = page;
	
	if( page == '' )
		return false;
		
	$('.page').hide();
	$('#'+page+' .reset-on-load').html('');
	
	// hide/show relevant content
	$('.menu-item-wrapper').removeClass('current');
	$('.menu-item-wrapper.'+page).addClass('current');
	
	$('.page#'+page).show();
    
    if( page == 'queue' ){
        updatePlayQueue();
    }
    
    if(page == 'search'){
		startSearch( hash[1] );
    };
    
    if(page == 'artist'){
		renderArtistPage( getIdFromUri(hash[1]) );
    };
    
    if(page == 'album'){
		renderAlbumPage( getIdFromUri(hash[1]) );
    };
    
    if(page == 'playlist'){
		renderPlaylistPage( hash[1] );
    };
    
    if(page == 'featured-playlists'){
		renderFeaturedPlaylistsPage( hash[1] );
    };
    
    if(page == 'new-releases'){
		renderNewReleasesPage( hash[1] );
    };
    
    if(page == 'settings'){
		renderSettingsPage();
    };

};


/*
 * Navigate the pages
 * Typically triggered by #menu items
 * @var page = string, ID of destination page
*/
function navigateToPage( page ){

	coreArray['currentPage'] == page;
	
	$('.menu-item-wrapper').removeClass('current');
	$('.menu-item-wrapper.'+page).addClass('current');
	
	$('.page').hide();
	$('.page#'+page).show();
	
	coreArray['currentPage'] = page;
}

/*
 * Explore a page type
 * Typically triggered by clicking any album or artist throughout the system
 * @var page = string, ID of destination subpage
*/
function exploreSubpage( subpage ){
	$('.explore-subpage').hide();
	$('.explore-subpage.'+subpage).show();
}


/*
 * Whence our document is ready
 * Initiate base navigation
*/
$(document).ready( function(evt){

    // listen to hash changes (drives all functionality!)
    $(window).on('hashchange',function(){
        navigate();
    });
    
});



/* ============================================================= PAGE RENDERERS ======== */
/* ===================================================================================== */


/*
 * Render the Explore Artist panel
 * Uses a combo of backend API and Spotify API
*/
function renderArtistPage( id ){
    
    updateLoader('start');
    
	// get the artist object
	getArtist( id ).success( function( artist ){
    
    	updateLoader('stop');
		
		// inject artist name
		$('#artist .artwork-panel .name').html( artist.name );
				
		imageURL = '';
		if( artist.images.length > 0 )
			imageURL = artist.images[0].url;
		
		$('#artist .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
		
		
		// ---- ALBUMS
		updateLoader('start');
		
		getArtistsAlbums( artist.id ).success(function( albums ){
			
			// empty out previous albums
			$('#artist .albums').html('');
			updateLoader('stop');
			
			// loop each album
			for(var i = 0; i < albums.items.length; i++){
			
				var album = albums.items[i];
				
				imageURL = '';
				if( album.images.length > 0 )
					imageURL = album.images[1].url;
				
				$('#artist .albums').append( '<a class="album-panel" href="#album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
			};
			
			// make them draggable
			$('#artist .albums').find('.album-panel').draggable({
				distance: 30,
				revert: true,
				revertDuration: 0,
				helper: 'clone',
				appendTo: 'body',
				zIndex: 10000
			});

		}).fail( function( response ){ 
			updateLoader('stop');
			notifyUser('error', 'Error fetching artist\'s albums: '+response.responseJSON.error.message );
		});
		
		
		
		// ---- TRACKS
			
		// drop in the loader
		updateLoader('start');
		
		getArtistsTopTracks( artist.id ).success(function( tracks ){
			
			// empty out previous albums
			$('#artist .tracks').html('');
			updateLoader('stop');
		
			renderTracksTable( $('#artist .tracks'), tracks.tracks );	
			
		}).fail( function( response ){
			updateLoader('stop');
			notifyUser('error', 'Error fetching artist\'s top tracks: '+response.responseJSON.error.message );
		});
		
		
		
		// --- RELATED ARTISTS
			
		// drop in the loader
		updateLoader('start');
		
		getRelatedArtists( artist.id ).success(function( relatedArtists ){
			
			// empty out previous related artists
			$('#artist .related-artists').html('');
			updateLoader('stop');
			
			// loop each artist
			for(var x = 0; x < relatedArtists.artists.length && x <= 8; x++){
			
				var relatedArtist = relatedArtists.artists[x];
				
				imageURL = '';
				if( relatedArtist.images.length > 0 ){
					var lastImage = relatedArtist.images.length-1;
					imageURL = relatedArtist.images[lastImage].url;
				}
				
				$('#artist .related-artists').append( '<a class="related-artist-panel" href="#artist/'+relatedArtist.uri+'" data-uri="'+relatedArtist.uri+'"><span class="thumbnail" style="background-image: url('+imageURL+');"></span><span class="name animate">'+relatedArtist.name+'</span><div class="clear-both"></div></a>' );
			}
		}).fail( function( response ){
    		updateLoader('stop');
			notifyUser('error', 'Error fetching related artists: '+response.responseJSON.error.message );
		});
    
    	updateLoader('stop');
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching artist: '+response.responseJSON.error.message );
	});
};


/*
 * Render featured playlists page
 * Shows a handful of featured and time-sensitive playlists
*/
function renderNewReleasesPage(){
    
    updateLoader('start');
	
	getNewReleases().then( function(response){
		
		// empty out previous albums
		$(document).find('#new-releases .content').html('');
		updateLoader('stop');
		
		// loop each album
		for(var i = 0; i < response.albums.items.length; i++){
		
			var album = response.albums.items[i];
			
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[1].url;
			
			$('#new-releases .content').append( '<a class="album-panel" href="#album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
		};
		
		// make them draggable
		$('#new-releases .content').find('.album-panel').draggable({
			distance: 30,
			revert: true,
			revertDuration: 0,
			helper: 'clone',
			appendTo: 'body',
			zIndex: 10000
		});
		

	})
	.fail( function( response ){
		updateLoader('stop');
		if( typeof response.responseJSON !== 'undefined' )
			notifyUser('error', 'Error fetching new releases: '+response.responseJSON.error.message );
		else
			notifyUser('error', 'Error fetching new releases, and no error response from API' );
	});
}


/*
 * Render featured playlists page
 * Shows a handful of featured and time-sensitive playlists
*/
function renderFeaturedPlaylistsPage(){
    
    updateLoader('start');

	$(document).find('#featured-playlists').show();

	getFeaturedPlaylists().success(function( playlists ) {
		
		var playlists = playlists.playlists.items;
		
		// empty out previous playlists
		$(document).find('#featured-playlists .content').html('');
		updateLoader('stop');
		
		for(var i = 0; i < playlists.length; i++){
			
			var playlist = playlists[i];
			
			imageURL = '';
			if( playlists.length > 0 )
				imageURL = playlist.images[0].url;
			
			$('#featured-playlists .content').append( '<a class="album-panel" href="#playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate hide">'+playlist.name+'</span></a>' );
			
		};
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching featured playlists: '+response.responseJSON.error.message );
	});
}





/*
 * Render the album page
 * Shows a single album and it's tracks
*/
function renderAlbumPage( id ){
    
    updateLoader('start');
    
	getAlbum( id ).success(function( album ){
	
		updateLoader('stop');
			
		imageURL = '';
		if( album.images.length > 0 )
			imageURL = album.images[0].url;
		
		$('#album .name').html( album.name );
		$('#album .artist').html( joinArtistNames(album.artists) );
		
		$('#album .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
		
		// save this tracklist in case we want to play one of the track items;
		coreArray['tracklistInFocus'] = album.tracks.items;
		
		renderTracksTable( $('#album .tracks'), album.tracks.items, album.uri, album );
		
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching album: '+response.responseJSON.error.message );
	});
}


/*
 * Render the a single playlist
*/
function renderPlaylistPage( uri ){
    
    updateLoader('start');

	var userid = uri.split(':')[2];
	var playlistid = uri.split(':')[4];
	
	getPlaylist( userid, playlistid ).success(function( playlist ){

		updateLoader('stop');
			
		// inject artist name
		$('#playlist .name').html( playlist.name );
		$('#playlist .tracks').attr( 'data-id', getIdFromUri(playlist.uri) );
		$('#playlist .tracks').attr( 'data-uri', playlist.uri );
		$('#playlist .tracks').attr( 'data-userid', userid );
		
		imageURL = '';
		if( playlist.images.length > 0 )
			imageURL = playlist.images[0].url;
		
		$('#playlist .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
		
		// empty out previous playlists
		$('#playlist .tracks').html('');
		
		// save this tracklist in case we want to play one of the track items;
		coreArray['tracklistInFocus'] = playlist.tracks.items;
		
		// load em up
		renderTracksTable( $('#playlist .tracks'), playlist.tracks.items );
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching playlist: '+response.responseJSON.error.message );
	});
	
};


/*
 * Render the interface settings page
*/
function renderSettingsPage(){
	
	console.log('Settings still to come');
	
};


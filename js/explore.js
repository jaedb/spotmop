/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Explore artists/albums functionality
 *
 */


/*
 * Explore an artist, album or playlist
 * @var uri = spotify uri
*/
function explore( type, uri ){
	
	// get the id (3rd part of the URI)
	if( typeof uri !== 'undefined' )
		var id = getIdFromUri( uri );
	
	navigateToPage('explore');
    
    coreArray['currentPageSection'] = type;
	
	// clear out all the data
	$('#explore .reset-on-load').html('<div class="loader"></div>');
	
	// reveal relevant subpage
	exploreSubpage(type);
		
	// artist view
	if( type == 'artist' ){
		
		getArtist( id ).success(function( artist ){
			renderExploreArtist( artist );
		}).fail( function( response ){ notifyUser('error', 'Error fetching artist: '+response.responseJSON.error.message ); } );
	
	// album view
	}else if( type == 'album' ){
		
		getAlbum( id ).success(function( album ) {
			renderExploreAlbum( album );
		}).fail( function( response ){ notifyUser('error', 'Error fetching album: '+response.responseJSON.error.message ); } );
	
	// playlist view
	}else if( type == 'playlist' ){
	
		var userid = uri.split(':')[2];
		var playlistid = uri.split(':')[4];
	
		// drop in the loader
		addLoader( $('#explore .playlist .tracks') );
		
		getPlaylist( userid, playlistid ).success(function( playlist ) {
			renderPlaylist( playlist );
		}).fail( function( response ){ notifyUser('error', 'Error fetching playlist: '+response.responseJSON.error.message ); } );
	}
	
};

/*
 * Render the Explore Artist panel
 * Uses a combo of backend API and Spotify API
*/
function renderExploreArtist( artist ){
    
    console.log(artist);
    
	// inject artist name
	$('.explore-subpage.artist .name').html( artist.name );
			
	imageURL = '';
	if( artist.images.length > 0 )
		imageURL = artist.images[0].url;
	
	$('.explore-subpage.artist .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
	
	
	// ---- ALBUMS (straight to Spotify API) ---- //
		
	// empty out previous albums
	addLoader( $('.explore-subpage.artist .albums') );
	
	getArtistsAlbums( artist.id ).success(function( albums ){
		
		// empty out previous albums
		$('.explore-subpage.artist .albums').html('');
		
		// loop each album
		for(var i = 0; i < albums.items.length; i++){
		
			var album = albums.items[i];
			
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[1].url;
			
			$('.explore-subpage.artist .albums').append( '<a class="album-panel" href="#explore/album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
		};
        
        // make them draggable
        $('.explore-subpage.artist .albums').find('.album-panel').draggable({
            distance: 30,
            revert: true,
            revertDuration: 0,
            helper: 'clone',
            appendTo: 'body',
            zIndex: 10000
        });

	}).fail( function( response ){ notifyUser('error', 'Error fetching artist\'s albums: '+response.responseJSON.error.message ); } );
	
	
	
	// ---- TRACKS (straight to Spotify API) ---- //
		
	addLoader( $('.explore-subpage.artist .tracks') );
	
	getArtistsTopTracks( artist.id ).success(function( tracks ){
		
		// empty out previous albums
		$('.explore-subpage.artist .tracks').html('');
	
		renderTracksTable( $('.explore-subpage.artist .tracks'), tracks.tracks );	
		
	}).fail( function( response ){ notifyUser('error', 'Error fetching artist\'s top tracks: '+response.responseJSON.error.message ); } );
	
	
	
	// ---- RELATED ARTISTS (straight to Spotify API) ---- //
		
	addLoader( $('.explore-subpage.artist .related-artists') );
	
	getRelatedArtists( artist.id ).success(function( relatedArtists ){
		
		// empty out previous related artists
		$('.explore-subpage.artist .related-artists').html('');
		
		// loop each artist
		for(var x = 0; x < relatedArtists.artists.length && x <= 10; x++){
		
			var relatedArtist = relatedArtists.artists[x];
			
			imageURL = '';
			if( relatedArtist.images.length > 0 )
				imageURL = relatedArtist.images[2].url;
			
			$('.explore-subpage.artist .related-artists').append( '<a class="related-artist-panel" href="#explore/artist/'+relatedArtist.uri+'" data-uri="'+relatedArtist.uri+'"><span class="thumbnail" style="background-image: url('+imageURL+');"></span><span class="name animate">'+relatedArtist.name+'</span><div class="clear-both"></div></a>' );
		}
	}).fail( function( response ){ notifyUser('error', 'Error fetching related artists: '+response.responseJSON.error.message ); } );
};


/*
 * Render the Explore Album panel
*/
function renderExploreAlbum( album ){
	
	addLoader( $('.explore-subpage.album .tracks') );
	
	imageURL = '';
	if( album.images.length > 0 )
		imageURL = album.images[0].url;
	
	$('.explore-subpage.album .name').html( album.name );
	$('.explore-subpage.album .artist').html( joinArtistNames(album.artists) );
	
	$('.explore-subpage.album .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
	
	// save this tracklist in case we want to play one of the track items;
	coreArray['tracklistInFocus'] = album.tracks.items;
	
	renderTracksTable( $('.explore-subpage.album .tracks'), album.tracks.items, album.uri, album );
};


/*
 * Render the a single playlist
*/
function renderPlaylist( playlist ){
	
	// inject artist name
	$('.explore-subpage.playlist .name').html( playlist.name );
	$('.explore-subpage.playlist').attr( 'data-uri', getIdFromUri(playlist.uri) );
			
	imageURL = '';
	if( playlist.images.length > 0 )
		imageURL = playlist.images[0].url;
	
	$('.explore-subpage.playlist .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
	
	// empty out previous playlists
	$('#explore .playlist .tracks').html('');
	
	// save this tracklist in case we want to play one of the track items;
	coreArray['tracklistInFocus'] = playlist.tracks.items;
	
	// load em up
	renderTracksTable( $('.explore-subpage.playlist .tracks'), playlist.tracks.items );
};


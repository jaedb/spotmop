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
	$('#menu .playlist-item.child-menu-item').removeClass('current');
	
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
    
    if(page == 'playlists'){
		renderUsersPlaylistsPage( hash[1] );
    };
    
    if(page == 'settings'){
		renderSettingsPage();
    };
    
    if(page == 'popular'){
		renderPopularPage();
    };
    
    if(page == 'discover'){
		renderDiscoverPage();
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
    
	
	$.when( checkToken() ).then( function(){
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
				
					// add clear-both at end of row
					if( (i+1) % 6 == 0 )
						$('#artist .albums').append('<div class="clear-both"></div>');
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
				
				if( relatedArtists.artists <= 0 )
					return false;
				
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
	
	});
};


/*
 * Render a user's playlists page
 * Shows a user's playlists
*/
function renderUsersPlaylistsPage( userID ){
	
	$.when( checkToken() ).then( function(){
    	updateLoader('start');
		getUsersPlaylists(userID).then( function(response){
			
			// empty out previous albums
			$(document).find('#playlists .content').html('');
			updateLoader('stop');
			
			// loop each playlist
			for(var i = 0; i < response.items.length; i++){
			
				var playlist = response.items[i];
				
				imageURL = '';
				if( playlist.images.length > 0 )
					imageURL = playlist.images[0].url;
				
				$('#playlists .content').append( '<a class="album-panel" href="#playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+playlist.name+'</span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 6 == 0 )
					$('#playlists .content').append('<div class="clear-both"></div>');
			};
			
	
		})
		.fail( function( response ){
			updateLoader('stop');
			notifyUser('error', 'Error fetching playlists: '+response.responseJSON.error.message );
		});
	});
}



/*
 * Render featured playlists page
 * Shows a handful of featured and time-sensitive playlists
*/
function renderNewReleasesPage(){
	
	$.when( checkToken() ).then( function(){
    	updateLoader('start');
		getNewReleases().then( function(response){
			
			// empty out previous albums
			$(document).find('#new-releases .content').html('');
			
			// loop each album
			for(var i = 0; i < response.albums.items.length; i++){
			
				var album = response.albums.items[i];
				
				imageURL = '';
				if( album.images.length > 0 )
					imageURL = album.images[1].url;
				
				$('#new-releases .content').append( '<a class="album-panel" href="#album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+album.name+'</span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 6 == 0 )
					$('#new-releases .content').append('<div class="clear-both"></div>');
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
			
			updateLoader('stop');
	
		})
		.fail( function( response ){
			updateLoader('stop');
			if( typeof response.responseJSON !== 'undefined' )
				notifyUser('error', 'Error fetching new releases: '+response.responseJSON.error.message );
			else
				notifyUser('error', 'Error fetching new releases, and no error response from API' );
		});
	});
}


/*
 * Render featured playlists page
 * Shows a handful of featured and time-sensitive playlists
*/
function renderFeaturedPlaylistsPage(){

	$(document).find('#featured-playlists').show();

	$.when( checkToken() ).then( function(){
    	updateLoader('start');
		getFeaturedPlaylists().success(function( playlists ) {
			
			var playlists = playlists.playlists.items;
			
			// empty out previous playlists
			$(document).find('#featured-playlists .content').html('');
			
			for(var i = 0; i < playlists.length; i++){
				
				var playlist = playlists[i];
				
				imageURL = '';
				if( playlists.length > 0 )
					imageURL = playlist.images[0].url;
				
				$('#featured-playlists .content').append( '<a class="album-panel" href="#playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate hide">'+playlist.name+'</span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 6 == 0 )
					$('#featured-playlists .content').append('<div class="clear-both"></div>');
			};
			
			updateLoader('stop');
			
		}).fail( function( response ){
			updateLoader('stop');
			notifyUser('error', 'Error fetching featured playlists: '+response.responseJSON.error.message );
		});
	});
}





/*
 * Render the album page
 * Shows a single album and it's tracks
*/
function renderAlbumPage( id ){
    
	$.when( checkToken() ).then( function(){
    	updateLoader('start');
		getAlbum( id ).success(function( album ){
				
			imageURL = '';
			if( album.images.length > 0 )
				imageURL = album.images[0].url;
			
			$('#album .name').html( album.name );
			$('#album .artist').html( joinArtistNames(album.artists) );
			
			$('#album .artwork-panel .background-image').attr('style','background-image: url('+imageURL+');');
			
			// save this tracklist in case we want to play one of the track items;
			coreArray['tracklistInFocus'] = album.tracks.items;
			
			renderTracksTable( $('#album .tracks'), album.tracks.items, album.uri, album );
			
			updateLoader('stop');
			
		}).fail( function( response ){
			updateLoader('stop');
			notifyUser('error', 'Error fetching album: '+response.responseJSON.error.message );
		});
	});
}


/*
 * Render the a single playlist
*/
function renderPlaylistPage( uri ){

	var userid = uri.split(':')[2];
	var playlistid = uri.split(':')[4];
	
	// hide the tools until we know whether we're following or not
	$('#playlist .tools').addClass('hide');
	
	// first, check the token
	$.when( checkToken() ).done( function(){
		
    	updateLoader('start');
		getPlaylist( userid, playlistid ).success(function( playlist ){
	
			updateLoader('stop');
				
			// inject artist name
			$('#playlist .name').html( playlist.name );
			$('#playlist .tracks').attr( 'data-id', getIdFromUri(playlist.uri) );
			$('#playlist .tracks').attr( 'data-uri', playlist.uri );
			$('#playlist .tracks').attr( 'data-userid', userid );
			
			// check following status
			isFollowingPlaylist( userid, getIdFromUri(playlist.uri) ).complete( function(response){
				if( response.responseJSON == 'true' ){
					$('#playlist .tools').removeClass('hide').addClass('following');
				}else{
					$('#playlist .tools').removeClass('hide').removeClass('following');
				};
			});
			
			// if this playlist uri matches a menu item, highlight it
			$('#menu .playlist-item.child-menu-item[data-uri="'+playlist.uri+'"]').addClass('current');
			
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
	});
	
};


/*
 * Render the interface settings page
*/
function renderSettingsPage(){
	
    if( coreArray['mopidyOnline'] ){
		$('#settings .mopidy.connection-status').addClass('online').removeClass('offline');
	}else{
		$('#settings .mopidy.connection-status').addClass('offline').removeClass('online');
		$('#settings .mopidy.connection-status .reconnect').on('click', function(evt){
			initiateMopidy();
		});
	}
	
	// load values into the fields (if it's not the default/placeholder)
	$('#settings input.autosave').each( function(index, value){
		if( $(value).attr('placeholder') != localStorage.getItem( 'settings_'+$(value).attr('name') ) )
			$(value).val( localStorage.getItem( 'settings_'+$(value).attr('name') ) );
	});
	
	// autosave
	$('#settings input.autosave').on('blur', function(evt){
		if( $(this).val() == null || $(this).val() == '' )
			localStorage.setItem( 'settings_'+$(this).attr('name'), $(this).attr('placeholder') );
		else
			localStorage.setItem( 'settings_'+$(this).attr('name'), $(this).val() );
			
		$(this).closest('.field').find('.autosave-success').show().delay(1000).fadeOut('slow');
	});
	
	
	/*
	 * Spotify service fields
	*/
	
	$.when( checkToken() ).then( function(){
		
		updateLoader('start');
				
		$('#settings .spotify.connection-status').addClass('online').removeClass('offline');
		
		getMyProfile().success( function(response){
			
			updateLoader('stop');
			
			localStorage.userID = response.id;
			
			var html = '';
			
			html += '<div class="thumbnail" style="background-image: url('+response.images[0].url+');"></div>';
			html += '<div class="name">'+response.display_name+' ('+response.id+')</div>';
			
			$('#settings .my-profile').html( html );
			
			$('#settings .log-out-button').on('click', function(evt){
				localStorage.removeItem('authorization_code');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('access_token');
				localStorage.removeItem('token_expiry');
				checkToken();
			});
		});
	});
	
	/* 
	 * Echonest service fields
	*/
	if( checkTasteProfile() ){				
		$('#settings .echonest.connection-status').addClass('online').removeClass('offline');	
	}else{
		$('#settings .echonest.connection-status').addClass('offline').removeClass('online');
	}
	
};



/*
 * Render the popular songs page
*/
function renderPopularPage(){
	
	updateLoader('start');
	
	getHotTracks().success( function(response){
		
		var artistIDs = '';
		
		for( var i = 0; i < response.response.songs.length; i++ ){
			var track = response.response.songs[i];
			if( i != 0 )
				artistIDs += ',';
			artistIDs += getIdFromUri( track.artist_foreign_ids[0].foreign_id );
		}
			
		updateLoader('start');
		getArtists(artistIDs).success( function(response){
			
			// loop each album
			for(var i = 0; i < response.artists.length; i++){
			
				var artist = response.artists[i];
				
				imageURL = '';
				if( artist.images.length > 0 )
					imageURL = artist.images[1].url;
				
				$('#popular .content').append( '<a class="album-panel" href="#artist/'+artist.uri+'" data-uri="'+artist.uri+'" style="background-image: url('+imageURL+');"><span class="name animate">'+artist.name+'</span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 6 == 0 )
					$('#popular .content').append('<div class="clear-both"></div>');
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
			
			updateLoader('stop');
		});
		
		var html = '';
		
		$('#popular .content').html( html );
		
		updateLoader('stop');
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching hot songs: '+response.response.responseJSON.error.message );
	});
	
};



/*
 * Render the popular songs page
*/
function renderDiscoverPage(){
	
	updateLoader('start');
	
	// get our taste profile
	getTasteProfileItems().success( function(response){
		
		console.log(response);
		
		var items = response.response.catalog.items;
		var artist_ids = '';
		
		// loop each song
		for( var i = 0; i < 5; i++ ){
			var item = items[i];
			if( typeof(item.artist_id) !== 'undefined' ){
				getSimilarArtists( item.artist_id ).success( function(response){
					console.log(response.response);
				});
			}
		}
		
		var html = '';
		
		$('#popular .content').html( html );
		
		updateLoader('stop');
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching discover content: '+response.response.responseJSON.error.message );
	});
	
};


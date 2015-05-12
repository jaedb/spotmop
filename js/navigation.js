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
	localStorage.currentPage = page;
	
	// reset the pagination link
	coreArray['playlistNextTracksLink'] = null;
	
	if( page == '' )
		page = 'featured-playlists';
		
	$('.page').hide();
	$('#'+page+' .reset-on-load').html('');
	
	// hide/show relevant content
	$('#menu .current').removeClass('current');
    $('#menu a[href="#'+page+'"]').parent().addClass('current');
	
	$('.page#'+page).show();
	
	// if we have a force refresh hash, just do it, no questions asked
	if( hash == 'force-token' ){
        $.when( getNewToken() ).then( function(evt){
			window.location = '/';
		});
	}
    
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
    
    if(page == 'my-playlists'){
		renderUsersPlaylistsPage( null, true );
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
		if( typeof(hash[1]) !== 'undefined' )
			renderDiscoverCategory( hash[1] );
		else
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
					
					$('#artist .albums').append( '<a class="album-panel square-panel" href="#album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="info animate"><span class="name">'+album.name+'</span></span></a>' );
				
					// add clear-both at end of row
					if( (i+1) % 5 == 0 )
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
function renderUsersPlaylistsPage( userID, myPlaylists ){
	
	$.when( checkToken() ).then( function(){
    	updateLoader('start');
		
		if( typeof(myPlaylists) !== 'undefined' && myPlaylists )
			userID = localStorage.userID;
			
		getUsersPlaylists(userID).then( function(response){
			
			var container = $(document).find('#playlists .content');
			
			if( typeof(myPlaylists) !== 'undefined' && myPlaylists )
				container = $(document).find('#my-playlists .content');
			
			// empty out previous albums
			container.html('');
			updateLoader('stop');
			
			// loop each playlist
			for(var i = 0; i < response.items.length; i++){
			
				var playlist = response.items[i];
				
				imageURL = '';
				if( playlist.images.length > 0 )
					imageURL = playlist.images[0].url;
					
				var details = playlist.tracks.total +' tracks';
				if( IsMyPlaylist( playlist ) )
					details += ' <i class="fa fa-user"></i>';
				
				container.append( '<a class="album-panel square-panel" href="#playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="info animate"><span class="name">'+playlist.name+'</span><span class="details">'+details+'</span></span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 5 == 0 )
					container.append('<div class="clear-both"></div>');
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
				
				$('#new-releases .content').append( '<a class="album-panel square-panel" href="#album/'+album.uri+'" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');"><span class="info animate"><span class="name">'+album.name+'</span></span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 5 == 0 )
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
				
				$('#featured-playlists .content').append( '<a class="album-panel square-panel" href="#playlist/'+playlist.uri+'" data-uri="'+playlist.uri+'" style="background-image: url('+imageURL+');"><span class="info animate"><span class="name">'+playlist.name+'</span><span class="details">'+playlist.tracks.total+' tracks</span></span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 5 == 0 )
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
	
	// hide the tools until we've loaded the playlist
	$('#playlist .tools').addClass('hide');
	
	// first, check the token
	$.when( checkToken() ).done( function(){
		
    	updateLoader('start');
		getPlaylist( userid, playlistid ).success(function( playlist ){
	
			updateLoader('stop');
            
            // save the next link to local storage
			coreArray['playlistNextTracksLink'] = playlist.tracks.next;
				
			// inject artist name
			$('#playlist .name').html( playlist.name );
			$('#playlist .tracks').attr( 'data-id', getIdFromUri(playlist.uri) );
			$('#playlist .tracks').attr( 'data-uri', playlist.uri );
			$('#playlist .tracks').attr( 'data-userid', userid );
			
			// check following status
			isFollowingPlaylist( userid, getIdFromUri(playlist.uri) ).complete( function(response){
				if( response.responseJSON == 'true' ){
					$('#playlist .tools .following .unfollow-playlist').removeClass('hide');
					$('#playlist .tools .following .follow-playlist').addClass('hide');
				}else{
					$('#playlist .tools .following .unfollow-playlist').addClass('hide');
					$('#playlist .tools .following .follow-playlist').removeClass('hide');
				};
				
				// now we have all we need, show the tools
				$('#playlist .tools').removeClass('hide');
			});
			
			// check ownership status
			if( localStorage.userID == userid ){
				$('#playlist .tools .owner').removeClass('hide');
			}else{
				$('#playlist .tools .owner').addClass('hide');
			};
			
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
	
    if( mopidyOnline ){
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
	 * System reset button
	 */
	$(document).on('click', '.reset-all-settings.confirming', function(evt){
		evt.preventDefault();
		localStorage.clear();
		window.location.reload();
	});
	
	
	/*
	 * Spotmop version code
	 * Syntax: branch number (latest commit hash, short)
	 */
	$.ajax({
		url: '/version.php',
		type: 'GET',
		success: function(response){
			$(document).find('.spotmop-version').html( response );
		}
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
				
				$('#popular .content').append( '<a class="album-panel square-panel" href="#artist/'+artist.uri+'" data-uri="'+artist.uri+'" style="background-image: url('+imageURL+');"><span class="info animate"><span class="name">'+artist.name+'</span></span></a>' );
				
				// add clear-both at end of row
				if( (i+1) % 5 == 0 )
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


/**
 * Produce a list of categories available
 **/
function renderDiscoverPage(){
	
	$(document).find('.page#discover .sub-page.category').hide();
	$(document).find('.page#discover .sub-page.index').show();
	
	var container = $(document).find('.page#discover .sub-page.index .content');
	container.html('');
	var html = '';
	
	updateLoader('start');
	
	// get the categories
	getCategories().success( function(response){
		
		// loop all the categories
		$(response.categories.items).each( function(key, category){
			
			var image = '';
			if( category.icons.length > 0 )
				image = category.icons[0].url;
			
			var link = '#discover/'+category.id;
			
			html += '<a class="category-panel square-panel" style="background-image: url('+image+');" href="'+link+'">';
				html += '<div class="title">'+category.name+'</div>';
			html += '</a>';
		});
		
		container.html( html );
		
		updateLoader('stop');
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching discover content: '+response.response.responseJSON.error.message );
	});
	
};




/**
 * Render a category item
 *
 * This basically gives us a list of playlists
 * @param categoryID = string
 **/
function renderDiscoverCategory( categoryID ){
	
	$(document).find('.page#discover .sub-page.index').hide();
	$(document).find('.page#discover .sub-page.category').show();
	
	var container = $(document).find('.page#discover .sub-page.category .content');
	var html = '';
	container.html('');
	
	updateLoader('start');
	
	// get the single category
	getCategory( categoryID ).success( function(response){
		
		$(document).find('.page#discover .sub-page.category .title').html( response.name );
		
		// now get his playlists
		getCategoryPlaylists( categoryID ).success( function(response){
		
			// loop all the playlists
			$(response.playlists.items).each( function(key, playlist){
				
				var image = '';
				if( playlist.images.length > 0 )
					image = playlist.images[0].url;
				
				var link = '#playlist/'+playlist.uri;
				
				html += '<a class="playlist-panel square-panel" style="background-image: url('+image+');" href="'+link+'">';
					html += '<span class="info animate">';
						html += '<span class="name">'+playlist.name+'</span>'
						html += '<span class="details">'+playlist.tracks.total+' tracks</span>';
					html += '</span>';
				html += '</a>';
			});
			
			container.html( html );
			
			updateLoader('stop');
		});
		
	}).fail( function( response ){
		updateLoader('stop');
		notifyUser('error', 'Error fetching discover content: '+response.response.responseJSON.error.message );
	});
	
};


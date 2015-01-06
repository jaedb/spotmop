/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz
 * 
 * Search for tracks
 *
 */


/*
 * Run a search for all content that matches a supplied term
 * @var query = string of search query
*/
function startSearch( query ){
	
	// reveal search results menu item
	$('.search-results-menu-item').show();
	$('.loader').show();
	
	// artists
	getSearchResults( 'artist', query ).success( function(response){
		
		var artists = response.artists.items;
		
		for( var i = 0; i < artists.length; i++ ){
			
			var artist = artists[i];
			
			if( artist.images.length > 0 )
				imageURL = artist.images[0].url;
				
			$('#search .artists').append( '<a class="artist-panel" data-uri="'+artist.uri+'" style="background-image: url('+imageURL+');" href="#artist/'+artist.uri+'"><span class="name animate">'+artist.name+'</span></a>' );
		}
		
	});
	
	// albums
	getSearchResults( 'album', query ).success( function(response){
		
		var albums = response.albums.items;
		
		for( var i = 0; i < albums.length; i++ ){
			
			var album = albums[i];
			
			if( album.images.length > 0 )
				imageURL = album.images[0].url;
			
			$('#search .albums').append( '<a class="album-panel" data-uri="'+album.uri+'" style="background-image: url('+imageURL+');" href="#album/'+album.uri+'"><span class="name animate">'+album.name+'</span></a>' );
		}
		
	});
	
	// tracks
	getSearchResults( 'track', query ).success( function(response){
		renderTracksTable( $('#search .tracks'), response.tracks.items );
	});
	
};



/*
 * Whence our document is ready
 * Initiate search functions
*/
$(document).ready( function(evt){

	// search submit <enter>
	$('.search-field input').keyup(function(evt){
		if( $(this).val() != '' && evt.keyCode == 13 )
			window.location.hash = 'search/'+$(this).val();
	});
	
	// search submit click
	$('.search-field .submit').on('click', function(evt){
		if( $(this).siblings('input').val() != '' )
			window.location.hash = 'search/'+$(this).siblings('input').val();
	});

});

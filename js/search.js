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
	
	// inject loaders
	addLoader( $('.search-results-section.artist .results') );
	addLoader( $('.search-results-section.album .results') );
	addLoader( $('.search-results-section.track .results') );
	
	// Search tracks
	$.ajax({
		url: spotifyAPI.track+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('track',result.tracks);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
	// Search albums
	$.ajax({
		url: spotifyAPI.album+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('album',result.albums);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
	// Search artists
	$.ajax({
		url: spotifyAPI.artist+query,
		type: "GET",
		dataType: "json",
		timeout: 5000,
		success: function(result){
			addSearchResults('artist',result.artists);
		},
		error: function(x,t,m){
			console.log(x+" - "+t+" - "+m);
		}
	});
	
};


/*
 * Add search results to the interface
 * Injects into #search page
*/
function addSearchResults(type, results){
	
	var counter = 0;
	
	$('#search-results .search-results-section.'+ type +' .results').html('');
	
	for(var i = 0;i < results.items.length; i++){
	
		var result = results.items[i];
		var imageURL = '';
		
		// artists
		if( type == 'artist' ){
			
			if( result.images.length > 0 )
				imageURL = result.images[0].url;
			
			$('#search-results .search-results-section.'+ type +' .results').append( '<a class="artist-panel" data-uri="'+result.uri+'" style="background-image: url('+imageURL+');" href="#explore/artist/'+result.uri+'"><span class="name animate">'+result.name+'</span></a>' );
		
		// albums
		}else if( type == 'album' ){
			
			if( result.images.length > 0 )
				imageURL = result.images[1].url;
			
			$('#search-results .search-results-section.'+ type +' .results').append( '<a class="album-panel" data-uri="'+result.uri+'" style="background-image: url('+imageURL+');" href="#explore/album/'+result.uri+'"><span class="name animate">'+result.name+'</span></a>' );
		
		// tracks
		}else if( type == 'track' ){
		
			$('#search-results .search-results-section.'+ type +' .results').append( '<div class="track-row row" data-uri="'+result.uri+'"><div class="name col w30">'+result.name+'</div><div class="name col w30">'+joinArtistNames(result.artists)+'</div><div class="name col w30"><span class="clickable" data-uri="'+ result.album.uri +'">'+result.album.name+'</span></div><div class="clear-both"></div></div>' );
		
		};
	};
	
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

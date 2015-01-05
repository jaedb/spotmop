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
    
    var section = hash[0];
    
    navigateToPage(section);
    
    if( section == 'queue' ){
        updatePlayQueue();
    }
    
    if(section == 'search'){
		startSearch( hash[1] );
    };
    
    if(section == 'explore'){
		explore( hash[1], hash[2] );
    };
    
    if(section == 'discover'){
		discover( hash[1] );
    };
    
    // hide playlist 'current' selectors
	$('#menu .playlist-item').removeClass('current');
	$('#playlists .playlist-subpage').addClass('hide');
    
    if(section == 'playlists'){
		$('#playlists .playlist-subpage[data-uri="'+hash[1]+'"]').removeClass('hide');
		$('#menu .playlist-item a[href="#playlists/'+hash[1]+'"]').parent().addClass('current');
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
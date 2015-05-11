/*
 * Spotmop
 * By James Barnsley (http://jamesbarnsley.co.nz)
 * 
 * Integration and authentication with Echonest API
 */

function checkTasteProfile(){
	
	if( typeof localStorage.settings_tasteprofileid == 'undefined' || localStorage.settings_tasteprofileid == null || localStorage.settings_tasteprofileid == '' || localStorage.settings_tasteprofileid == 'undefined' ){
		
		updateLoader('start');	
		
		createTasteProfile()
			.success( function(response){
				
				localStorage.settings_tasteprofileid = response.response.id;
				
				$('#settings input[name="tasteprofileid"]').val(localStorage.settings_tasteprofileid);
				$('#settings .echonest.connection-status').addClass('online').removeClass('offline');
				
				notifyUser('good','Taste profile created');
				updateLoader('stop');
			})
			.fail( function(response){
				notifyUser('good','There was a problem creating your taste profile: '+response.status.message);
				updateLoader('stop');				
			});
		
		return false;		
	}else{
		return true;
	}
}

function getHotTracks(){
	return $.ajax({
		url: 'http://developer.echonest.com/api/v4/song/search?api_key=YVW64VSEPEV93M4EG&sort=song_hotttnesss-desc&bucket=id:spotify',
		type: "GET",
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		timeout: 10000
	});	
};

function createTasteProfile(){
	return $.ajax({
		url: 'http://developer.echonest.com/api/v4/catalog/create',
		method: "POST",
		data: {
				api_key: 'YVW64VSEPEV93M4EG',
				format: 'json',
				type: 'general',
				name: 'spotmop:' + Date.now() + Math.round((Math.random() + 1) * 1000),
			},
		timeout: 10000
	});	
};

/*
 * Add data to our taste profile
 * @var uri = uri of item we're adding (to create a unique id)
 * @var artist = string
 * @var name = string
*/
function updateTasteProfile( uri, name, artist ){
	return $.ajax({
		url: 'http://developer.echonest.com/api/v4/catalog/update',
		method: "POST",
		data: {
				api_key: 'YVW64VSEPEV93M4EG',
				id: localStorage.settings_tasteprofileid,
				data: JSON.stringify([
						{
							'action': 'play',
							// this is the item that we want to add to the taste profile
							'item':{
								'track_id': uri		// using project rosetta stone, EchoNest should know this Spotify track_id
							}
						}
					])
			},
		timeout: 10000
	});	
};

/*
 * Get the taste profile items
 * Returns all the items that this user has starred
*/
function getTasteProfileItems(){
	
	var url = 'http://developer.echonest.com/api/v4/tasteprofile/read?api_key=YVW64VSEPEV93M4EG';
	url += '&id='+localStorage.settings_tasteprofileid;

	return $.ajax({
		url: url,
		method: "GET",
		timeout: 10000
	});	
};

/*
 * Get a set of related tracks, based on our taste profile
 * Returns echonest json, so this will need analysis before feeding to Spotify
 * NOTE: This isn't getting anything useful ... just the taste profile items. D'oh!
*/
function getSimilarArtists( artistID ){
	
	var url = 'http://developer.echonest.com/api/v4/artist/similar?api_key=YVW64VSEPEV93M4EG';
	url += '&id='+artistID;

	return $.ajax({
		url: url,
		method: "GET",
		timeout: 10000
	});	
};

/*
 * Get a set of similar songs, based on the provided EchoNest songID
 * Returns Echonest response
*/
function getSimilarSongs( songID ){
	
	var url = 'http://developer.echonest.com/api/v4/song/similar?api_key=YVW64VSEPEV93M4EG';
	url += '&id='+songID;

	return $.ajax({
		url: url,
		method: "GET",
		timeout: 10000
	});	
};
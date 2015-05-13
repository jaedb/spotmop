<?php

$url = 'http://'.$_SERVER["SERVER_NAME"].substr($_SERVER["SCRIPT_NAME"],strrpos($_SERVER["SCRIPT_NAME"],"/"));

/**
 * Acquire an authorization code.
 *
 * This is what connects an account's authorization for this app to use their account 
 * for future tokens and queries. Redirects to Spotify.
 * @param $url = redirect url (this script)
*/
function getAuthorizationCode( $url ){
	
	header('Location: https://accounts.spotify.com/authorize?client_id=a87fb4dbed30475b8cec38523dff53e2&redirect_uri='.$url.'&scope=playlist-modify-private%20playlist-modify-public%20playlist-read-private%20playlist-modify-private&response_type=code&show_dialog=true');
	die();
}

/*
 * Get a new access token
 * Creates a request to Spotify, which returns a new access_token, refresh_token and token_expiry object
 * @param $code = string
 * @param $url = redirect url (this script)
*/
function getToken( $code, $url ){
	
	$ch = curl_init();

	if (FALSE === $ch)
		throw new Exception('Failed to initialize');
		
	$post_data = array(
			'client_id' => 'a87fb4dbed30475b8cec38523dff53e2',
			'client_secret' => 'd7c89d0753ef4068bba1678c6cf26ed6',
			'grant_type' => 'authorization_code',
			'code' => $code,
			'redirect_uri' => $url
		);
	
	curl_setopt($ch, CURLOPT_URL,"https://accounts.spotify.com/api/token");
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
	curl_setopt($ch, CURLINFO_HEADER_OUT, true);
	curl_setopt($ch, CURLOPT_VERBOSE, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	
	$response = curl_exec($ch);
	
	if(curl_errno($ch)){
		echo 'CURL Error: '. curl_error($ch);
	}
	
	curl_close($ch);
	
	return $response;
}

/*
 * Refresh a token 
 * Creates a request to Spotify, which returns a new access_token, refresh_token and token_expiry object
 * @var $refresh_token = string
*/
function refreshToken($refresh_token){
	
	$ch = curl_init();

	$post_data = array(
			'client_id' => 'a87fb4dbed30475b8cec38523dff53e2',
			'client_secret' => 'd7c89d0753ef4068bba1678c6cf26ed6',
			'grant_type' => 'refresh_token',
			'refresh_token' => $refresh_token
		);

	curl_setopt($ch, CURLOPT_URL,"https://accounts.spotify.com/api/token");
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
	curl_setopt($ch, CURLINFO_HEADER_OUT, true);
	curl_setopt($ch, CURLOPT_VERBOSE, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	curl_close ($ch);
	
	return $response;
}


/*
 * Parse the authorization code, once Spotify has received the OK from the user
 * This is the first instance where we get the authorization_code, so should only happen once
 * URL Parameter of ?code= is required
*/
if( isset($_GET['authorization']) ){
	getAuthorizationCode( $url );
}
	
/*
 * Parse the authorization code, once Spotify has received the OK from the user
 * This is the first instance where we get the authorization_code, so should only happen once
 * URL Parameter of ?code= is required
*/
if( isset($_GET['code']) ){
	
	// take our spotify response, and inject it to our localStorage
	?>
		<script type="text/javascript">
			var response = <?php echo getToken($_GET['code'], $url ); ?>;
			var Spotify = JSON.parse( localStorage.getItem('ngStorage-Spotify') );
			Spotify.AuthorizationCode = "<?php echo $_GET['code'] ?>";
			Spotify.AccessToken = response.access_token;
			Spotify.RefreshToken = response.refresh_token;
			localStorage.setItem('ngStorage-Spotify', JSON.stringify( Spotify ));
		</script>
	<?php
}
	

/*
 * Refresh the token
 * Triggered by a detection that the token is expired, and the application decides it needs to be refreshed
 * $authorization_code = string
 * Returns JSON with new token details
*/
if( isset($_GET['refresh_token']) ){
	
	// return whatever spotify returned to us
	echo refreshToken($_GET['refresh_token']);
	die();
}


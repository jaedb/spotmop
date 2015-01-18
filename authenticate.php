<?php

/*
 * Get a new access token
 * Creates a request to Spotify, which returns a new access_token, refresh_token and token_expiry object
 * @var $code = string
*/
function getToken($code){
	
	$ch = curl_init();

	$post_data = array(
			'client_id' => 'a87fb4dbed30475b8cec38523dff53e2',
			'client_secret' => 'd7c89d0753ef4068bba1678c6cf26ed6',
			'grant_type' => 'authorization_code',
			'code' => $code,
			'redirect_uri' => 'http://'.$_SERVER["SERVER_NAME"].substr($_SERVER["SCRIPT_NAME"],strrpos($_SERVER["SCRIPT_NAME"],"/"))
		);

	curl_setopt($ch, CURLOPT_URL,"https://accounts.spotify.com/api/token");
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);
	curl_close ($ch);
	
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
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));

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
if( isset($_GET['code']) ){
	
	// let's save our authorization code to local storage for future use
	?>
		<script type="text/javascript">
			localStorage.authorization_code = '<?php echo $_GET['code']; ?>';
		</script>
	<?php
	
	// we've now got authorization, let's get an access token
	$response = getToken($_GET['code']);
	
	// now let's parse the access token back to the js application
	?>
		<script type="text/javascript">
			var response = <?php echo $response ?>;
			
			localStorage.refresh_token = response.refresh_token;
			localStorage.access_token = response.access_token;
			localStorage.token_expiry = new Date().getTime() + 3600000;
			localStorage.readyToRefresh = true;
			
			window.close();
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
	
	echo refreshToken($_GET['refresh_token']);
	die();
}


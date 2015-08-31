<?php

/*
 * Figure out what the current version is
 * Uses the current GitHub branch to identify
 * Relies on branch syntax of release/x.xx
*/

// describe our current tag
$tag = exec('git describe --abbrev=0 --tags');

// get the commit hash (short version)
$commit = exec('git rev-parse --short HEAD');

// fatal response, meaning we're not on a tag (we've deviated, or 'Detached')
if( $tag ){
	$version = $tag;
}else{
	$version = 'Latest development version';
}

echo json_encode(array( 'version' => $version, 'commit' => $commit ));
return;
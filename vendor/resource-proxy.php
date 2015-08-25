<?php

if( !isset($_GET['url']) )
    return false;

$url = $_GET['url'];

$contents = file_get_contents( $url );
echo $contents;


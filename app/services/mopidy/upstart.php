<?php

/**
 * Portal script that allows Spotmop interface to interact
 * with the mopidy upstart script. Will require installation as below:
 *
 * 1. Grant PHP user sudo access by adding the following to /etc/sudoers:
 *    www-data ALL=NOPASSWD:{ABSOLUTEPATHTOWEBDIR}/app/services/mopidy/upstart
 **/
 
$status = exec("sudo ".realpath(dirname(__FILE__))."/upstart ".$_GET['action']);

echo $status;
return;
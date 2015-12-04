<?php

/**
 * Portal script that allows Spotmop interface to interact
 * with the mopidy upstart script. Will require installation as below:
 *
 * 1. Grant PHP user sudo access to upstart wrapper by adding the following to /etc/sudoers:
 *    www-data ALL=NOPASSWD:{ABSOLUTEPATHTOWEBDIR}/app/services/mopidy/upstart.sh
 **/
 
$action = $_GET['action'];
$result = exec("sudo ".realpath(dirname(__FILE__))."/upstart.sh ".$action);

echo $result;

return;
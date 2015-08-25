<?php

/*
 * Figure out what the current version is
 * Uses the current GitHub branch to identify
 * Relies on branch syntax of release/x.xx
*/

$branch = exec('git rev-parse --abbrev-ref HEAD');
$branch = str_replace('release/','',$branch);
$commit = exec('git rev-parse --short HEAD');
echo $branch .' ('.$commit.')';
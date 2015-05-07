Spotmop
=======

Spotmop Mopidy HTTP interface

Requirements
--------

* Mopidy
* Mopidy-Spotify

Changelog
--------

*1.5*
* Upgrade to track selection events, now uses proper syntax and command structure.
* Cross-browser drag-and-drop sorting of tracks in playlists and queue.
* Pretty full-screen player (inspired by Spotcommander)
* Add custom playlists (you still need write permission as a Spotify user)

*1.2*
* Stability improvements
* Various browser bugs (drag and drop for Chrome)
* Base-level responsive formatting

Installation
--------

1. Get Mopidy server running with Mopidy-Spotify plugin
2. Extract Spotmop to your http root folder (as specified in ~/.config/mopidy/mopidy.conf
3. Navigate to your server address (typically http://localhost:6680/)
4. Alternatively, extract Spotmop to any webserver and configure your Mopidy server address on the Settings tab

Features
--------

* Full web-based interface controls for Mopidy
* Uses Spotify API to deliver high-quality audio and music information
* Spotmop can be run completely independently of your Mopidy machine, just set your URL in the settings tab

Screenshots
-----------

![Artist](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-artist.jpg)
![Playlist with drag-and-drop functionality](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-playlist.jpg)
![Settings](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-settings.jpg)

To-do
-----

* Look into more mature framework to deliver templates (AngularJS?)
* Drag-and-drop for albums and artists
* Improve performance of ad-hoc track lists (ie artist top tracks, public playlists)
* Create second playlists area for 'Subscribed' playlists

Credits
-------

I trawled through `dirkgroenen`'s code to understand how Mopidy works, and there are some sections of code that I copied and modified. You can see his Mopify project here: https://github.com/dirkgroenen/Mopify

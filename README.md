Spotmop
=======

Spotmop Mopidy HTTP interface

Requirements
--------

* Mopidy
* Mopidy-Spotify

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

![Overview](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/overview.jpg)

![Browse](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-browse.jpg)

![Artist](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-artist.jpg)

![Single playlist](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-playlist.jpg)

![Dragging tracks](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-dragging.jpg)

![Settings](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-settings.jpg)


Changelog
--------

*2.4
* Redesign of interface (verical bars)
* Basic implementation of artist discovery
* Drag-and-drop to playlists
* Performance improvement

*2.1.2 (beta)*
* Upstart script that allows start/stop/restart of Mopidy server from HTTP interface
* Switch to enable/disable keyboard shortcuts
* General bugfixes

*2.1*
* Responsive layouts, with collasing menu, condensed player and dynamic panel sizes
* Various performance improvements
* Improvement to directives and code structure
* General bugfixes

*2.0*
* Full migration into AngularJS Framework
* Introduction of Spotify Discover endpoint. This facilitates browsing playlists by genre.
* Performance improvements

*1.5*
* Upgrade to track selection events, now uses proper syntax and command structure.
* Cross-browser drag-and-drop sorting of tracks in playlists and queue.
* Pretty full-screen player (inspired by Spotcommander)
* Add custom playlists (you still need write permission as a Spotify user)

*1.2*
* Stability improvements
* Various browser bugs (drag and drop for Chrome)
* Base-level responsive formatting

To-do
-----

* Speed improvements to adding tracks to the tracklist (possible Mopidy-Spotify limitation)
* Further improve responsive layouts and touch interactions
* Create second playlists area for 'Subscribed' playlists

Credits
-------

I trawled through `dirkgroenen`'s code to understand how Mopidy works, and there are some sections of code that I copied and modified. You can see his Mopify project here: https://github.com/dirkgroenen/Mopify

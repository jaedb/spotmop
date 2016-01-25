Spotmop
=======

Spotmop Mopidy HTTP interface

![badge](https://img.shields.io/pypi/v/mopidy-spotmop.svg?style=flat)
![badge](https://img.shields.io/pypi/dm/mopidy-spotmop.svg)

Requirements
--------

* Mopidy
* Mopidy-Spotify
* Spotify Premium account

Installation
--------

1. Install using pip: `sudo pip install Mopidy-Spotmop`
2. Restart Mopidy server
3. Navigate to Mopidy interface (ie http://localhost:6680/spotmop)

Features
--------

* Full web-based interface controls for Mopidy
* Uses Spotify API to deliver high-quality audio and music information
* Browse and manage your playlists, along with top tracks, new releases and genre browser
* Spotmop can be run completely independently of your Mopidy machine (ie on a remote server), just set your URL in the settings tab
* Push notifications (beta) between users (requires port 6681, but this can be customised to suit your environment)

Screenshots
-----------

![Overview](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/overview.jpg)

![Play queue](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-queue.jpg)

![Featured playlists](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-featured.jpg)

![Artist](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-artist.jpg)

![Single playlist](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-playlist.jpg)

![Dragging tracks](https://raw.githubusercontent.com/jaedb/spotmop/master/Screenshots/desktop-dragging.jpg)


Changelog
--------

*2.5*
* Port to Mopidy extension

*2.4*
* Redesign of interface (vertical bars)
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
* Increase stability of Mopidy server (perhaps limitation of Rpi?)
* Full integration as Mopidy extension with Tornado Websockets for client:client communication

Credits
-------

I trawled through `dirkgroenen`'s code to understand how Mopidy works, and there are some sections of code that I copied and modified. You can see his Mopify project here: https://github.com/dirkgroenen/Mopify

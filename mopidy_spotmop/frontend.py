from __future__ import unicode_literals

import logging, os, json, pykka, pylast, spotipy, pusher, auth
import tornado.web
import tornado.websocket
import tornado.ioloop
from mopidy import config, ext
from mopidy.core import CoreListener

# import logger
logger = logging.getLogger(__name__)

    
###
# Spotmop supporting frontend
#
# This provides a wrapping thread for the Pusher websocket, as well as the radio infrastructure
##
class SpotmopFrontend(pykka.ThreadingActor, CoreListener):

    def __init__(self, config, core):
        global spotmop
        super(SpotmopFrontend, self).__init__()
        self.config = config
        self.core = core
        self.radio = {
            "enabled": 0,
            "seed_artists": [],
            "seed_genres": [],
            "seed_tracks": []
        }

    def on_start(self):
        
        # try and start a pusher server
        port = str(self.config['spotmop']['pusherport'])
        try:
            self.pusher = tornado.web.Application([( '/pusher', pusher.PusherWebsocketHandler, { 'frontend': self } )])
            self.pusher.listen(port)
            logger.info('Pusher server running at [0.0.0.0]:'+port)
            
        except( pylast.NetworkError, pylast.MalformedResponseError, pylast.WSError ) as e:
            logger.error('Error starting Pusher: %s', e)
            self.stop()
    
    ##
    # Listen for core events, and update our frontend as required
    ##
    def track_playback_ended( self, tl_track, time_position ):
        self.check_for_radio_update()
        
        
    ##
    # See if we need to perform updates to our radio
    #
    # We see if we've got one or two tracks left, if so, go get some more
    ##
    def check_for_radio_update( self ):
        try:
            tracklistLength = self.core.tracklist.length.get()        
            if( tracklistLength <= 5 and self.radio['enabled'] == 1 ):
                self.load_more_tracks()
                
        except RuntimeError:
            logger.warning('RadioHandler: Could not fetch tracklist length')
            pass


    ##
    # Load some more radio tracks
    #
    # We need to build a Spotify authentication token first, and then fetch recommendations
    ##
    def load_more_tracks( self ):
    
        try:
            token = auth.AuthHelper().get_token()
            token = token['access_token']
        except:
            logger.error('SpotmopFrontend: Spotify authentication failed')
            
        try:
            spotify = spotipy.Spotify( auth = token )
            response = spotify.recommendations(seed_artists = self.radio['seed_artists'], seed_genres = self.radio['seed_genres'], seed_tracks = self.radio['seed_tracks'], limit = 5)
            
            uris = []
            for track in response['tracks']:
                uris.append( track['uri'] )
            
            self.core.tracklist.add( uris = uris )
        except:
            logger.error('SpotmopFrontend: Failed to fetch recommendations from Spotify')
            
    
    ##
    # Change our radio config
    ##
    def change_radio( self, messageJson ):
        
        # reset state to begin with
        old_state = self.radio
        new_state = {}
        
        # set each of our properties, to match the JSON data
        new_state['enabled'] = messageJson['enabled']
        new_state['seed_artists'] = messageJson['seed_artists']
        new_state['seed_genres'] = messageJson['seed_genres']
        new_state['seed_tracks'] = messageJson['seed_tracks']
            
        # make sure we've actually changed something
        if( old_state['enabled'] != new_state['enabled'] ) or ( old_state['seed_artists'] != new_state['seed_artists'] ) or ( old_state['seed_genres'] != new_state['seed_genres'] ) or ( old_state['seed_tracks'] != new_state['seed_tracks'] ):
            
            # set our new radio state
            self.radio = new_state
        
            # explicitly set consume, to ensure we don't end up with a huge tracklist (and it's how a radio should 'feel')
            self.core.tracklist.set_consume( True )
            
            # get our radio to start playing
            self.core.tracklist.clear()
            self.load_more_tracks()
            self.core.playback.play()
            
            # notify clients
            pusher.send_message('radio_changed', self.radio )
        
        
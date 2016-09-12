import os, tornado.web, json, pykka, logging
from tornado.escape import json_encode, json_decode

from mopidy.models import TlTrack, Track
from mopidy.core.listener import CoreListener
from mopidy.core.tracklist import TracklistController

import pusher

logger = logging.getLogger(__name__)

state = {
    "radio_mode": False,
    "seed_tracks": [],
    "seed_artists": [],
}
oldState = {}


##
# Radio handler
#
# Listens for system-triggered playback events and handles radio functionality
##
class RadioHandler(pykka.ThreadingActor, CoreListener, TracklistController):

    def __init__(self, core, pusher):
        super(RadioHandler, self).__init__()
        self.core = core
        self.pusher = pusher
    
    # When playback starts on any kind of track
    ## THIS IS NOT BEING CALLED??
    def track_playback_started(self, tl_track):
        try:
            tracklistLength = self.core.tracklist.length.get()
            logger.info(tracklistLength)
            if( tracklistLength <= 2 and state['radio_mode'] ):
                logger.info( 'Intervene here' )
        except RuntimeError:
            logger.warning('RadioHandler: Could not fetch tracklist length')
            pass

            
##
# Radio HTTP request handler
#
# Provides HTTP endpoint for radio-based interaction
# TODO: Move this into the Pusher websocket to remove the need for yet another endpoint
##
class RadioRequestHandler(tornado.web.RequestHandler):

    def initialize(self, core, config):
        self.core = core
        self.config = config
    
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
	
    ## get the current state
    def get(self):
        self.write(json_encode(state))
	
    ## post to update the state
    def post(self):
        data = json_decode( self.request.body )
        
        # reset state to begin with
        global oldState, state
        oldState = state
        state = {}
        
        # and then update each of our properties, to match the JSON data
        state['radio_mode'] = data['radio_mode']
        state['seed_tracks'] = data['seed_tracks']
        state['seed_artists'] = data['seed_artists']
        
        # send notification (if values changed)
        if( oldState['radio_mode'] != state['radio_mode'] ) or ( oldState['seed_tracks'] != state['seed_tracks'] ) or ( oldState['seed_artists'] != state['seed_artists'] ):
            pusher.send_message('radio_changed', state )
        
        # now return the update state
        self.write(json_encode(state))
        
    
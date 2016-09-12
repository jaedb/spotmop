import os, tornado.web, json, pykka, logging
from tornado.escape import json_encode, json_decode

from mopidy.models import TlTrack, Track
from mopidy.core.listener import CoreListener
from mopidy.core.tracklist import TracklistController

import pusher

logger = logging.getLogger(__name__)

## when enabled, RadioFrontend intervenes with track events
state = {
    "radioMode": False,
    "seed_tracks": [],
    "seed_artists": [],
}

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
            self.pusher.broadcast('testing',{ "yeah": "nah" })
            if( tracklistLength <= 2 and state['radioMode'] ):
                logger.info( 'Intervene here' )
        except RuntimeError:
            logger.warning('RadioFrontend: Could not fetch tracklist length')
            pass

class RadioRequestHandler(tornado.web.RequestHandler, pykka.ThreadingActor, CoreListener):
    
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config):
        self.core = core
        self.config = config
	
    ## get the current state
    def get(self, action):
        self.write(json_encode(state))
	
    ## post to update the state
    def post(self):
        data = json_decode( self.request.body )
        
        # reset state to begin with
        state = {}
        
        # and then update each of our properties, to match the JSON data
        state['radioMode'] = data['radioMode']
        state['seed_tracks'] = data['seed_tracks']
        state['seed_artists'] = data['seed_artists']
        
        # broadcast update via Pusher
        pusherHandler = self.core.ext.mopidy_spotmop.pusher
        pusher.PusherHandler.broadcast( pusherHandler, 'playback_mode', state )
        
        # self.core.send( "test_event" )#, { "data": "yeah nah" } )
        
        # now return the update state
        self.write(json_encode(state))
        
def spotmop_radio_factory(config, core):
    return [
        ('/', RadioRequestHandler, {'core': core, 'config': config})
    ]
    
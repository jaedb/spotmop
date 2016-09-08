import os, tornado.web, json, pykka, logging
from tornado.escape import json_encode, json_decode

from mopidy.models import TlTrack, Track
from mopidy.core.listener import CoreListener
from mopidy.core.tracklist import TracklistController

logger = logging.getLogger(__name__)

## when enabled, RadioFrontend intervenes with track events
radioMode = True

class RadioFrontend(pykka.ThreadingActor, CoreListener, TracklistController):
    def __init__(self, config, core):
        super(RadioFrontend, self).__init__()
        self.config = config
        self.core = core
    
    ## When playback starts on any kind of track
    def track_playback_started(self, tl_track):
        try:
            tracklistLength = self.core.tracklist.length.get()
            logger.info(tracklistLength)
            if( tracklistLength <= 2 and radioMode ):
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
    def post(self, mode):
        state['mode'] = 'radio'
        self.write(json_encode(state))
        
def spotmop_radio_factory(config, core):
    return [
        ('/', RadioRequestHandler, {'core': core, 'config': config})
    ]
    
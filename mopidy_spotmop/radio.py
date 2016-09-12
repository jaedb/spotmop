import os, tornado.web, json, pykka, logging
from tornado.escape import json_encode, json_decode

from mopidy.models import TlTrack, Track
from mopidy.core.listener import CoreListener
from mopidy.core.tracklist import TracklistController

import spotipy
import sys
    
import mopidy_spotmop, pusher, auth

logger = logging.getLogger(__name__)

state = {
    "radio_mode": 0,
    "seed_artists": [],
    "seed_genres": [],
    "seed_tracks": []
}
oldState = {}
    
##
# See if we need to perform updates to our radio
#
# We see if we've got one or two tracks left, if so, go get some more
##
def check_for_radio_update(core):
    try:
        tracklistLength = core.tracklist.length.get()        
        if( tracklistLength <= 2 and state['radio_mode'] == 1 ):
            load_more_tracks(core)
            
    except RuntimeError:
        logger.warning('RadioHandler: Could not fetch tracklist length')
        pass

##
# Load some more radio tracks
#
# We need to build a Spotify authentication token first, and then fetch recommendations
##
def load_more_tracks(core):
    try:
        token = auth.AuthHelper().get_token()
        token = token['access_token']
        spotify = spotipy.Spotify( auth = token )
        response = spotify.recommendations(seed_artists = state['seed_artists'], seed_genres = state['seed_genres'], seed_tracks = state['seed_tracks'], limit = 2)
        
        uris = []
        for track in response['tracks']:
            uris.append( track['uri'] )
        
        core.tracklist.add( uris = uris )
    except:
        logger.error('RadioHandler: Failed to fetch recommendations from Spotify')

        
     
##
# Radio handler
#
# Listens for system-triggered playback events and handles radio functionality
##
class RadioHandler(pykka.ThreadingActor, CoreListener):

    def __init__(self, core, pusher):
        super(RadioHandler, self).__init__()
        self.core = core
        self.pusher = pusher

            
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
        global oldState, state, wasConsume
        oldState = state
        state = {}
        
        # and then update each of our properties, to match the JSON data
        state['radio_mode'] = data['radio_mode']
        state['seed_artists'] = data['seed_artists']
        state['seed_genres'] = data['seed_genres']
        state['seed_tracks'] = data['seed_tracks']
        
        # explicitly set consume, to ensure we don't end up with a huge tracklist (and it's how a radio should 'feel')
        self.core.tracklist.set_consume( True )
        
        # get our radio to start playing
        self.core.tracklist.clear()
        load_more_tracks(self.core)
        self.core.playback.play()
        
        # send notification (if values changed)
        if( oldState['radio_mode'] != state['radio_mode'] ) or ( oldState['seed_artists'] != state['seed_artists'] ) or ( oldState['seed_genres'] != state['seed_genres'] ) or ( oldState['seed_tracks'] != state['seed_tracks'] ):
            pusher.send_message('radio_changed', state )
        
        # now return the update state
        self.write(json_encode(state))
        
    
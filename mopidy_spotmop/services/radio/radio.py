import os, tornado.web, base64, urllib, urllib2, json, pykka, subprocess
from tornado.escape import json_encode, json_decode
from mopidy import core
from tornado.escape import json_encode

state = {
	'mode': 'normal'
}

class RadioRequestHandler(tornado.web.RequestHandler, core.CoreListener, pykka.ThreadingActor):
    
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
        
    def on_event( event, kwargs ):
        logger.info(event)
        
def spotmop_radio_factory(config, core):
    return [
        ('/', RadioRequestHandler, {'core': core, 'config': config})
    ]
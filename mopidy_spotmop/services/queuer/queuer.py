import os
import tornado.web
import base64
import urllib, urllib2, json
from tornado.escape import json_encode, json_decode

from tornado.escape import json_encode
import subprocess

state = {
	'mode': 'normal'
}

class QueuerRequestHandler(tornado.web.RequestHandler):
    
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config):
        self.core = core
        self.config =  config
	
    ## get the current state
    def get(self, action):
        self.write(json_encode(state))
	
    ## post to update the state
    def post(self, mode):
        state['mode'] = 'radio'
        self.write(json_encode(state))


def spotmop_queuer_factory(config, core):
    return [
        ('/', QueuerRequestHandler, {'core': core, 'config': config})
    ]
import os
import tornado.web
import base64
import urllib, urllib2, json

from tornado.escape import json_encode
import subprocess

class AuthRequestHandler(tornado.web.RequestHandler):
    
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config, version):
        self.core = core
        self.config =  config
        self.version = version
	
	# check if we're able to upgrade, and what our current version is
    def get(self):

        url = 'https://accounts.spotify.com/api/token'
        authorization = 'YTg3ZmI0ZGJlZDMwNDc1YjhjZWMzODUyM2RmZjUzZTI6ZDdjODlkMDc1M2VmNDA2OGJiYTE2NzhjNmNmMjZlZDY='

        headers = {
            'Authorization' : 'Basic ' + authorization
            }
        data  = {
            'grant_type' : 'client_credentials'
            }
            
        data_encoded = urllib.urlencode( data )
        req = urllib2.Request(url, data_encoded, headers)

        try:
            response = urllib2.urlopen(req, timeout=30).read()
            response_dict = json.loads(response)
            self.write(response_dict)
            return
        except urllib2.HTTPError as e:
            return e


def spotmop_auth_factory(config, core):
    return [
        ('/', AuthRequestHandler, {'core': core, 'config': config})
    ]
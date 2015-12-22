import os
import cgi
import tornado.web

from tornado.escape import json_encode
import subprocess

class IdentifyRequestHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config, version):
		self.core = core
		self.version = version
	
	# check if we're able to upgrade, and what our current version is
    def get(self):
        ip = self.request.remote_ip
        self.write(json_encode({'ip': ip}))

def spotmop_identify_factory(config, core):
    return [
        ('/', IdentifyRequestHandler, {'core': core, 'config': config})
    ]
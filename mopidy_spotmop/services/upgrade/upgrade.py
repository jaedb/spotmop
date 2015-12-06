import os
import tornado.web

from tornado.escape import json_encode
import subprocess

class UpgradeRequestHandler(tornado.web.RequestHandler):
    isroot = False

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config):
        self.core = core

        # Check if root user
        if os.geteuid() == 0:
            self.isroot = True

    def get(self):
        self.write(json_encode({'response': self.isroot}))

    def post(self):
        if not self.isroot:
			status = 'error'
			message = 'Mopidy needs to run as root user to perform upgrades'
        else:
            try:
				subprocess.check_call(["pip", "install", "--upgrade", "mopidy-spotmop"])
				status = 'success'
				message = 'Upgrade succesful'
            except subprocess.CalledProcessError:
				status = 'error'
				message = "The upgrade failed"

        self.write(json_encode({'status': status, 'message': message}))


def mopify_upgrade_factory(config, core):
    return [
        ('/', UpgradeRequestHandler, {'core': core, 'config': config})
    ]
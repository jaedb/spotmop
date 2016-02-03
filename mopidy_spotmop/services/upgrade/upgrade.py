import os
import tornado.web

from tornado.escape import json_encode
import subprocess

class UpgradeRequestHandler(tornado.web.RequestHandler):
    isroot = False

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config, version):
		self.core = core
		self.version = version

        # Check if root user
		if os.geteuid() == 0:
			self.isroot = True
	
	# check if we're able to upgrade, and what our current version is
    def get(self):
		self.write(json_encode({'root': self.isroot, 'currentVersion': self.version}))

    def post(self):
        if not self.isroot:
			status = 'error'
			message = 'Mopidy needs to run as root user to perform upgrades'
        else:
            try:
				subprocess.check_call(["pip", "install", "--upgrade", "Mopidy-Spotmop"])
				status = 'success'
				message = 'Upgrade succesful - please restart Mopidy'
            except subprocess.CalledProcessError:
				status = 'error'
				message = "The upgrade failed"

        self.write(json_encode({'message': message, 'status': status}))


def spotmop_upgrade_factory(config, core):
    return [
        ('/', UpgradeRequestHandler, {'core': core, 'config': config})
    ]
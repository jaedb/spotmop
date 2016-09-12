from __future__ import unicode_literals

import logging, os, json, pykka, pylast
import tornado.web
import tornado.websocket
import tornado.ioloop

from mopidy import config, ext
from mopidy.core import CoreListener

# import our other Spotmop classes
import upgrade, pusher, auth, radio

logger = logging.getLogger(__name__)
    
    
###
# Spotmop supporting frontend
#
# This provides a wrapping thread for the Pusher websocket, as well as the radio infrastructure
##
class SpotmopFrontend(pykka.ThreadingActor, CoreListener):

    def __init__(self, config, core):
        super(SpotmopFrontend, self).__init__()
        self.pusher = None
        self.radio = None
        self.config = config
        self.core = core

    def on_start(self):
        
        # try and start a pusher server
        port = str(self.config['spotmop']['pusherport'])
        try:
            self.pusher = tornado.web.Application([( '/pusher', pusher.PusherWebsocketHandler )])
            self.pusher.listen(port)
            logger.info('Pusher server running at [0.0.0.0]:'+port)
            
        except( pylast.NetworkError, pylast.MalformedResponseError, pylast.WSError ) as e:
            logger.error('Error starting Pusher: %s', e)
            self.stop()
            
        # try and setup our radio
        try:
            self.radio = radio.RadioHandler(self.core, self.pusher)
        except( pylast.NetworkError, pylast.MalformedResponseError, pylast.WSError ) as e:
            logger.error('Error starting Radio handler: %s', e)
            self.stop()

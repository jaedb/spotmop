import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.template
import logging
import uuid
import os
import cgi
from tornado.escape import json_encode,json_decode
from mopidy import config, ext
import subprocess

logger = logging.getLogger(__name__)
clients = []

## PUSHER WEBSOCKET SERVER
class PusherHandler(tornado.websocket.WebSocketHandler):

  def check_origin(self, origin):
    return True
  
  def open(self):
    self.id = str(uuid.uuid4())
    clients.append({'id': self.id, 'ip': self.request.remote_ip, 'connection': self})
    print clients
    logger.debug( 'New Spotmop Pusher connection' )

  def on_message(self, message):
    for client in clients:
        client['connection'].write_message(message)
    logger.debug( 'Spotmop Pusher message received' )

  def on_close(self):
    ## TODO : This is not removing the killed connection from the list. Use list or dict?
    remainingClients = []
    for client in clients:
        if client['id'] != self.id:
            remainingClients.append( client )
    logger.debug( 'Spotmop Pusher connection closed' )
    
 
## PUSHER HTTP ENDPOINT
class PusherRequestHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")

    def initialize(self, core, config, version):
		self.core = core
		self.config = config
		self.version = version
	
    def get(self, action):
    
        if action == 'me':
            ip = self.request.remote_ip
            self.write(json_encode({'ip': ip}))
            
        elif action == 'connections':
            clientList = {}
            for client in clients:
                clientList[client['id']] = ({'id': client['id'], 'ip': client['ip']})
            self.write(json_encode(clientList))

def spotmop_pusher_factory(config, core):
    return [
        ('/', PusherRequestHandler, {'core': core, 'config': config})
    ]
    
  
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
clients = {}

## PUSHER WEBSOCKET SERVER
class PusherHandler(tornado.websocket.WebSocketHandler):

  def check_origin(self, origin):
    return True
  
  def open(self):
    self.id = str(uuid.uuid4())
    self.details = {"id": self.id, "ip": self.request.remote_ip, "name": "User"}
    clients[self.id] = { 'details': self.details, 'connection': self}
    
    # send a message to the client with it's assigned details
    connectedMessage = '{"pusher": "true", "startup": "true", "details": '+ json_encode(self.details) +'}'
    self.write_message( connectedMessage )
    logger.debug( 'New Spotmop Pusher connection: '+ self.id )

  def on_message(self, message):
    for client in clients.itervalues():
        client['connection'].write_message(message)
    logger.debug( 'Spotmop Pusher message received from '+ self.id )

  def on_close(self):
    if self.id in clients:
        del clients[self.id]
    logger.debug( 'Spotmop Pusher connection to '+ self.id +' closed' )
    
 
## PUSHER HTTP ENDPOINT
class PusherRequestHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET,POST")
        self.set_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.set_header("Content-Type", "application/json")

    def initialize(self, core, config, version):
		self.core = core
		self.config = config
		self.version = version
        
    # get method
    def get(self, action):
    
        if action == 'me':
            id = self.get_query_argument('id')
            name = self.get_query_argument('name')
            
            # save the payload name to the client list
            clients[id]['details']['name'] = name
            
            # return the updated client details
            self.write( '{"status":"ok"}' )
            
        elif action == 'connections':
            clientDetailsList = []
            for client in clients.itervalues():
                clientDetailsList.append(client['details'])
            self.write(json_encode(clientDetailsList))

def spotmop_pusher_factory(config, core):
    return [
        ('/', PusherRequestHandler, {'core': core, 'config': config})
    ]
    
  
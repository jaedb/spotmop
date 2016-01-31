import tornado.ioloop, tornado.web, tornado.websocket, tornado.template
import logging, uuid, os, subprocess
from datetime import datetime
from tornado.escape import json_encode, json_decode
from mopidy import config, ext

logger = logging.getLogger(__name__)
clients = {}

## PUSHER WEBSOCKET SERVER
class PusherHandler(tornado.websocket.WebSocketHandler):

  def check_origin(self, origin):
    return True

  def initialize(self, version):
    self.version = version
  
  def open(self):
    created = datetime.strftime(datetime.now(), '%Y-%m-%d %H:%M:%S')    
    self.id = str(uuid.uuid4().hex)
    self.details = {"id": self.id, "ip": self.request.remote_ip, "name": "User", "created": created}
    clients[self.id] = { 'details': self.details, 'connection': self}
    
    # send a message to the client with it's assigned details
    connectedMessage = '{"pusher": "true", "startup": "true", "details": '+ json_encode(self.details) +', "version": "'+self.version+'"}'
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
            id = self.get_argument('id','id')
            name = self.get_argument('name','name')
            
            # save the payload name to the client list
            if id in clients:
                clients[id]['details']['name'] = name
                self.write( '{"status":"ok"}' )
            else:
                self.write( '{"status":"error","message":"Client does not exist"}' )
            
        elif action == 'connections':
            clientDetailsList = []
            for client in clients.itervalues():
                clientDetailsList.append(client['details'])
            self.write(json_encode(clientDetailsList))

def spotmop_pusher_factory(config, core, version):
    return [
        ('/', PusherRequestHandler, {
                'core': core,
                'config': config,
                'version': version
            })
    ]
    
  
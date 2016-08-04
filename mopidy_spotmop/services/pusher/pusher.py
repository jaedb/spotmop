import tornado.ioloop, tornado.web, tornado.websocket, tornado.template
import logging, uuid, os, subprocess
from datetime import datetime
from tornado.escape import json_encode, json_decode
from mopidy import config, ext
from mopidy.core import CoreListener

logger = logging.getLogger(__name__)
connections = {}
  
# send a message to all connections
# @param event = string (event name, ie connection_opened)
# @param data = array (any data required to include in our message)
def send_message( event, data ):
    for connection in connections.itervalues():
        message = '{"type": "'+event+'", "data": '+ json_encode( data ) +'}'
        connection['connection'].write_message( message )
        
# digest a protocol header into it's id/name parts
def digest_protocol( protocol ):

    # facilitate wrapping list objects, silly various browser formats and also Jupiter's orbit...
    protocol = ''.join(protocol)
    protocol = protocol.replace(',','').replace('[','').replace(']','')
    elements = protocol.split('_')
    
    # if we've been given a valid array
    try:
      username = elements[0]
      connectionid = elements[1]
      
    # invalid, so just create a default connection, and auto-generate an ID
    except:
      username = str(uuid.uuid4().hex)
      connectionid = username
    
    # construct our protocol object, and return
    return {"protocol": protocol, "username": username, "connectionid": connectionid}

## PUSHER WEBSOCKET SERVER
class PusherHandler(tornado.websocket.WebSocketHandler, CoreListener):

  def check_origin(self, origin):
    return True

  def initialize(self, version):
    self.version = version
  
  # when a new connection is opened
  def open(self):
    
    # decode our connection protocol value (which is a payload of id/name from javascript)
    protocolElements = digest_protocol(self.request.headers.get('Sec-Websocket-Protocol', '[]'))        
    connectionid = protocolElements['connectionid']
    self.connectionid = connectionid
    username = protocolElements['username']
    created = datetime.strftime(datetime.now(), '%Y-%m-%d %H:%M:%S')
    
    # construct our client object, and add to our list of connections
    client = { "connectionid": connectionid, "username": username, "ip": self.request.remote_ip, "created": created, "version": self.version }
    connections[connectionid] = { 'client': client, 'connection': self }
    
    logger.debug( 'New Spotmop Pusher connection: '+ connectionid +'  '+ username )
    
    # notify all other clients that a new user has connected
    send_message( 'client_connected', client )
  
  def select_subprotocol(self, subprotocols):
    # return the id. This lets the client know we've accepted this connection
    return digest_protocol( subprotocols )['protocol']
  
  # server received a message
  def on_message(self, message):
    messageJson = json_decode(message)
    
    if messageJson['type'] == 'client_updated':
        if messageJson['origin']['connectionid'] in connections:            
            connections[messageJson['origin']['connectionid']]['client']['username'] = messageJson['data']['newVal']
            logger.debug( 'Spotmop Pusher connection '+ self.connectionid +' updated' )
    
    
    # recipients array has items, so only send to specific clients
    if messageJson['recipients']:    
      for connectionid in messageJson['recipients']:
        connectionid = connectionid.encode("utf-8")
        connections[connectionid]['connection'].write_message(message)
    
    # empty, so send to all clients
    else:    
      for connection in connections.itervalues():
        if connection['client']['connectionid'] != self.connectionid:
          connection['connection'].write_message(message)
        
    logger.debug( 'Spotmop Pusher message received from '+ self.connectionid )
  
  # connection closed
  def on_close(self):
    if self.connectionid in connections:
        
        clientRemoved = connections[self.connectionid]['client']
        logger.debug( 'Spotmop Pusher connection to '+ self.connectionid +' closed' )
        
        # now actually remove it
        del connections[self.connectionid]
        
        send_message( 'client_disconnected', clientRemoved )
  
  def ThreadWorker(self, stopThreadEvent):
    logger.info('Starting')
    wsURL = 'ws://music.james:6680/mopidy/ws'
    try:
      ws = websocket.create_connection(wsURL)
      while not stopThreadEvent.isSet():
        response = ws.recv()
        logger.info(response)
    except:
      logger.info('Error')
      
## PUSHER HTTP ENDPOINT
class PusherRequestHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET,POST")
        self.set_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.set_header("Content-Type", "application/json")

    def initialize(self, core, config):
		self.core = core
		self.config = config
        
    # get method
    def get(self, action):
    
        if action == 'connections':
            connectionsDetailsList = []
            for connection in connections.itervalues():
                connectionsDetailsList.append(connection['client'])
            self.write(json_encode(connectionsDetailsList))

def spotmop_pusher_factory(config, core):
    return [
        ('/', PusherRequestHandler, {
                'core': core,
                'config': config
            })
    ]
    
  
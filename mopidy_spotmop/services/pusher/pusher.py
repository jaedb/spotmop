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
    
    # if we're a string, split into list
    # this handles the different ways we get this passed (select_subprotocols gives string, headers.get gives list)
    if isinstance(protocol, basestring):
    
        # make sure we strip any spaces (IE gives "element,element", proper browsers give "element, element")
        protocol = [i.strip() for i in protocol.split(',')]
    
    # if we've been given a valid array
    try:
      clientid = protocol[0]
      connectionid = protocol[1]
      username = protocol[2]
      generated = False
      
    # invalid, so just create a default connection, and auto-generate an ID
    except:
      clientid = str(uuid.uuid4().hex)
      connectionid = str(uuid.uuid4().hex)
      username = str(uuid.uuid4().hex)
      generated = True
    
    # construct our protocol object, and return
    return {"clientid": clientid, "connectionid": connectionid, "username": username, "generated": generated}

## PUSHER WEBSOCKET SERVER
class PusherHandler(tornado.websocket.WebSocketHandler, CoreListener):

  def check_origin(self, origin):
    return True

  def initialize(self, version):
    self.version = version
  
  # when a new connection is opened
  def open(self):
    
    # decode our connection protocol value (which is a payload of id/name from javascript)
    protocolElements = digest_protocol(self.request.headers.get('Sec-Websocket-Protocol', []))
    
    connectionid = protocolElements['connectionid']
    clientid = protocolElements['clientid']
    self.connectionid = connectionid
    username = protocolElements['username']
    created = datetime.strftime(datetime.now(), '%Y-%m-%d %H:%M:%S')
    
    # construct our client object, and add to our list of connections
    client = { "clientid": clientid, "connectionid": connectionid, "username": username, "ip": self.request.remote_ip, "created": created, "version": self.version }
    connections[connectionid] = { 'client': client, 'connection': self }
    
    logger.debug( 'New Spotmop Pusher connection: '+ connectionid +' ('+ clientid +'/'+ username +')' )
    
    # notify all other clients that a new user has connected
    send_message( 'client_connected', client )
  
  def select_subprotocol(self, subprotocols):
    # select one of our subprotocol elements and return it. This confirms the connection has been accepted.
    protocols = digest_protocol( subprotocols )
    
    # if we've auto-generated some ids, the provided subprotocols was a string, so just return it right back
    # this allows a connection to be completed
    if protocols['generated']:
        return subprotocols[0]
        
    # otherwise, just return one of the supplied subprotocols
    else:
        return protocols['clientid']
  
  # server received a message
  def on_message(self, message):
    messageJson = json_decode(message)
    
    # construct the origin client info
    messageJson['origin'] = { 'connectionid' : self.connectionid, 'clientid': connections[self.connectionid]['client']['clientid'], 'ip': self.request.remote_ip, 'username': connections[self.connectionid]['client']['username'] }
    
    if messageJson['type'] == 'client_updated':
        if messageJson['origin']['connectionid'] in connections:            
            connections[messageJson['origin']['connectionid']]['client']['username'] = messageJson['data']['newVal']
            logger.debug( 'Spotmop Pusher connection '+ self.connectionid +' updated' )
    
    # recipients array has items, so only send to specific clients
    if messageJson['recipients']:    
      for connectionid in messageJson['recipients']:
        connectionid = connectionid.encode("utf-8")
        connections[connectionid]['connection'].write_message(messageJson)
    
    # empty, so send to all clients
    else:    
      for connection in connections.itervalues():
        connection['connection'].write_message(messageJson)
        
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
    
  
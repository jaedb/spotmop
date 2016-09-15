import tornado.ioloop, tornado.web, tornado.websocket, tornado.template
import logging, uuid, os, subprocess, pykka, mopidy_spotmop
from datetime import datetime
from tornado.escape import json_encode, json_decode

logger = logging.getLogger(__name__)

# container for all current pusher connections
connections = {}
frontend = {}
  
  
##
# Send a message to an individual connection
#
# @param recipient_connection_ids = array
# @param type = string (type of event, ie connection_opened)
# @param action = string (action method of this message)
# @param message_id = string (used for callbacks)
# @param data = array (any data required to include in our message)
##
def send_message( recipient_connection_id, type, action, message_id, data ):          
    message = {
        'type': type,
        'action': action,
        'message_id': message_id,
        'data': data
    }
    connections[recipient_connection_id]['connection'].write_message( json_encode(message) )
        
        
##
# Broadcast a message to all recipients
#
# @param action = string
# @param data = array (the body of our message to send)
##
def broadcast( action, data ):    
    for connection in connections.itervalues():
        message = {
            'type': 'broadcast',
            'action': action,
            'data': data
        }
        connection['connection'].write_message( json_encode(message) )
        
        
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

    
##
# Websocket server
#
# This is the actual websocket thread that accepts, digests and emits messages.
# TODO: Figure out how to merge this into the main Mopidy websocket to avoid needing two websocket servers
##    
class PusherWebsocketHandler(tornado.websocket.WebSocketHandler):
    
    def initialize(self, frontend):
        self.version = mopidy_spotmop.__version__
        self.frontend = frontend

    def check_origin(self, origin):
        return True
  
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

        # broadcast to all connections that a new user has connected
        broadcast( 'client_connected', client )
  
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
        
        # query-based message that is expecting a response
        if messageJson['type'] == 'query':
        
            # change our radio state
            if messageJson['action'] == 'change_radio':
                self.frontend.change_radio( messageJson )
            
            # fetch our current radio state
            if messageJson['action'] == 'get_radio':
                send_message( self.connectionid, 'response', 'get_radio_state', messageJson['message_id'], self.frontend.radio )
            
            # fetch our pusher connections
            if messageJson['action'] == 'get_connections':
                connectionsDetailsList = []
                for connection in connections.itervalues():
                    connectionsDetailsList.append(connection['client'])
                send_message( self.connectionid, 'response', 'get_connections', messageJson['message_id'], connectionsDetailsList )
            
            # connection update requested
            if messageJson['action'] == 'update_connection':
                if messageJson['origin']['connectionid'] in connections:            
                    connections[messageJson['origin']['connectionid']]['client']['username'] = messageJson['data']['newVal']
        
        # point-and-shoot one-way broadcast
        elif messageJson['type'] == 'broadcast':

            # recipients array has items, so only send to specific clients
            if messageJson.has_key('recipients'):  
                for connectionid in messageJson['recipients']:
                    connectionid = connectionid.encode("utf-8")
                    connections[connectionid]['connection'].write_message(messageJson)

            # empty, so send to all clients
            else:    
                for connection in connections.itervalues():
                
                    # if we've set ignore_self, then don't send message to originating connection
                    if messageJson.has_key('ignore_self'):
                        if connection['client']['connectionid'] != messageJson['origin']['connectionid']:
                            connection['connection'].write_message(messageJson)
                            
                    # send it to everyone
                    else:
                        connection['connection'].write_message(messageJson)
                        
        logger.debug( 'Pusher: Message received from '+ self.connectionid )
  
    # connection closed
    def on_close(self):
        if self.connectionid in connections:
            
            clientRemoved = connections[self.connectionid]['client']
            logger.debug( 'Spotmop Pusher connection to '+ self.connectionid +' closed' )
            
            # now actually remove it
            try:
                del connections[self.connectionid]
            except:
                logger.info( 'Failed to close connection to '+ self.connectionid )                
            
            broadcast( 'client_disconnected', clientRemoved )
        
        
        
  
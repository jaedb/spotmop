import os
import tornado.web
import subprocess
from tornado.escape import json_encode,json_decode
from tinydb import TinyDB, Query

class UsersRequestHandler(tornado.web.RequestHandler):

  db = TinyDB( os.path.join( os.path.dirname(__file__), 'users.json') )

  def set_default_headers(self):
    self.set_header("Access-Control-Allow-Origin", "*")
    self.set_header("Access-Control-Allow-Headers", "X-Requested-With")
    self.set_header("Content-Type", "application/json")

  def initialize(self, core, config, version):
    self.core = core
    self.version = version
    #self.db.purge()
    #self.db.insert({'ip': '192.168.1.99', 'name': 'Desktop'})

  # check this client ip address, and return details (or empty array if not found)
  # TODO: handle localhost/127.0.0.1 as clientip
  def get(self):
    
    # find our record
    clientip = self.request.remote_ip
    query = Query()
    record = self.db.search( query.ip == clientip )
    
    if record:
        output = json_encode(record[0])
    else:
        output = '[]'
    
    # respond
    self.write( output )
  
  # add/update a single ip address on the users list
  def post(self):
  
    # load the request payload
    data = json_decode(self.request.body)
    data['ip'] = self.request.remote_ip
    
    # make sure we have the required payload 
    if not data.has_key('name'):
       return self.write( '{"status":"failed"}' )
       
    # update our record
    query = Query()
    self.db.remove( query.ip == data['ip'])    
    self.db.insert( data )
    
    # respond
    record = self.db.search( query.ip == data['ip'] )[0]
    output = '{"status":"success", "record": {"ip":"'+ record['ip'] +'","name":"'+ record['name'] +'"}}'
    self.write( output )

def spotmop_users_factory(config, core):
    return [
        ('/', UsersRequestHandler, {'core': core, 'config': config})
    ]
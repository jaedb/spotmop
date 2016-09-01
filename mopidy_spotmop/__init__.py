from __future__ import unicode_literals

import logging
import os
import tornado.web
import tornado.websocket
import json

from services.upgrade import upgrade
from services.pusher import pusher
from services.auth import auth
from services.queuer import queuer
from mopidy import config, ext

__version__ = '2.9.1'
__ext_name__ = 'spotmop'
__verbosemode__ = False

logger = logging.getLogger(__name__)

class SpotmopExtension(ext.Extension):
    dist_name = 'Mopidy-Spotmop'
    ext_name = __ext_name__
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(SpotmopExtension, self).get_config_schema()
        schema['debug'] = config.Boolean()
        schema['pusherport'] = config.String()
        return schema

    def setup(self, registry):

        # Add web extension
        registry.add('http:app', {
            'name': self.ext_name,
            'factory': spotmop_client_factory
        })

        logger.info('Starting Spotmop web client '+ self.version)

class ArtworkHandler(tornado.web.RequestHandler):
    def get(self, file):
        self.write("You requested the file " + file)
        
def spotmop_client_factory(config, core):

	# TODO create minified version of the project for production (or use Bower or Grunt for building??)
    environment = 'dev' if config.get(__ext_name__)['debug'] is True else 'prod'
    spotmoppath = os.path.join( os.path.dirname(__file__), 'static')
    
    # PUSHER: TODO: need to fire this up from within the PusherHandler class... somehow
    pusherport = str(config['spotmop']['pusherport'])
    application = tornado.web.Application([
        ('/pusher', pusher.PusherHandler, {
                'version': __version__
            }),
    ])
    application.listen(pusherport)
    
    logger.info( 'Pusher server running on []:'+ str(pusherport) )
	
    return [
		(r'/upgrade', upgrade.UpgradeRequestHandler, {
				'core': core,
				'config': config,
				'version': __version__ 
			}),
		(r'/pusher/([^/]+)', pusher.PusherRequestHandler, {
				'core': core,
				'config': config
			}),
		(r'/auth', auth.AuthRequestHandler, {
				'core': core,
				'config': config
			}),
		(r'/queuer/([^/]*)', queuer.QueuerRequestHandler, {
				'core': core,
				'config': config
			}),
        (r"/images/(.*)", tornado.web.StaticFileHandler, {
            "path": config['local-images']['image_dir']
        }),
        (r'/(.*)', tornado.web.StaticFileHandler, {
				"path": spotmoppath,
				"default_filename": "index.html"
			}),
    ]

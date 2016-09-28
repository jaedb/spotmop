from __future__ import unicode_literals

import logging, os, json
import tornado.web
import tornado.websocket
from mopidy import config, ext
from frontend import SpotmopFrontend

logger = logging.getLogger(__name__)
__version__ = '2.10.1'

##
# Core extension class
#
# Loads config and gets the party started. Initiates any additional frontends, etc.
##
class SpotmopExtension( ext.Extension ):

    dist_name = 'Mopidy-Spotmop'
    ext_name = 'spotmop'
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
            'factory': factory
        })
        
        # add our frontend
        registry.add('frontend', SpotmopFrontend)
        
def factory(config, core):

    path = os.path.join( os.path.dirname(__file__), 'static')
	
    return [
        (r"/images/(.*)", tornado.web.StaticFileHandler, {
            "path": config['local-images']['image_dir']
        }),
        (r'/(.*)', tornado.web.StaticFileHandler, {
				"path": path,
				"default_filename": "index.html"
			}),
    ]

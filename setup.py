from __future__ import unicode_literals

import re
from setuptools import setup, find_packages

def get_version(filename):
    content = open(filename).read()
    metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", content))
    return metadata['version']

setup(
    name='Mopidy-Spotmop',
    version=get_version('mopidy_spotmop/__init__.py'),
    url='https://github.com/jaedb/spotmop',
    license='Apache License, Version 2.0',
    author='James Barnsley',
    author_email='james@barnsley.nz',
    description='A Mopidy Web client that utilizes the Spotify and EchoNest frameworks',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=[
        'setuptools >= 3.3',
        'Mopidy >= 0.19',
        'ConfigObj'
    ],
    classifiers=[
        'Environment :: No Input/Output (Daemon)',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2',
        'Topic :: Multimedia :: Sound/Audio :: Players',
    ],
    entry_points={
        'mopidy.ext': [
            'spotmop = mopidy_spotmop:SpotmopExtension',
        ],
    },
)

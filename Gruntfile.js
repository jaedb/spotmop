module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            build: {
                cwd: 'src',
                src: ['**/*', '!scss', '!**/*.js', '!vendor'],
                dest: 'mopidy_spotmop/static',
                expand: true
            },
        },
        concat: {
            js: {
                src: [
						// load our vendor files first
						'src/vendor/jquery.min.js',
						'src/vendor/angular.js',
						'src/vendor/*.js',
						'src/**/*.js'
					],
                dest: 'mopidy_spotmop/static/app.js'
            }
        },
		ngAnnotate: {
			options: {},
			js: {
				files: {
					'mopidy_spotmop/static/app-annotated.js': ['mopidy_spotmop/static/app.js']
				}
			},
		},
        uglify: {
            options: {
                banner: '/**\n * <%= pkg.name %>\n * Built <%= grunt.template.today("yyyy-mm-dd") %>\n **/\n\n',
				ASCIIOnly: 'true',
				compress: {
					drop_console: true
				}
            },
            build: {
                src: 'mopidy_spotmop/static/app-annotated.js',
                dest: 'mopidy_spotmop/static/app.min.js'
            }
        },
        sass: {
			build: {
				files: {
					'mopidy_spotmop/static/app.css': 'src/scss/app.scss'
				}
			}
        },
        cssmin: {
            options: {
                processImport: false,
                shorthandCompacting: false,
                roundingPrecision: -1,
				sourceMap: true
            },
            build: {
                files: {
					'mopidy_spotmop/static/app.min.css': 'mopidy_spotmop/static/app.css'
                }
            }
        },
        processhtml: {
			options: {
				includeBase:  true
			},
            build: {
                files: {
                    'mopidy_spotmop/static/index.html': 'mopidy_spotmop/static/testing.html'
                }
            }
        },
		watch: {
			scripts: {
				files: ['src/app/**/*.js', 'src/**/*.html'],
				tasks: ['copy','ngAnnotate','concat','uglify','processhtml']
			},
			css: {
				files: ['src/scss/**/*.scss', 'src/**/*.html'],
				tasks: ['copy','sass','cssmin','processhtml']
			}
		}
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-ng-annotate');
	grunt.loadNpmTasks('grunt-processhtml');

    // Default task(s).
    grunt.registerTask('default', ['copy', 'concat', 'ngAnnotate', 'uglify', 'sass', 'cssmin', 'processhtml', 'watch']);

};
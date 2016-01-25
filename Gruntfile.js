module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: ['src/vendor/jquery.min.js','src/vendor/angular.js','src/vendor/*.js','src/app/app.js','src/app/**/*.js'],
                dest: 'mopidy_spotmop/static/app.js'
            },
            css: {
                src: 'src/assets/css/*.css',
                dest: 'mopidy_spotmop/static/assets/css/style.css'
            }
        },
        uglify: {
            options: {
                banner: '/**\n * <%= pkg.name %>\n * Built <%= grunt.template.today("yyyy-mm-dd") %>\n **/\n\n'
            },
            build: {
                src: 'mopidy_spotmop/static/app.js',
                dest: 'mopidy_spotmop/static/app.min.js'
            }
        },
        cssmin: {
            options: {
                processImport: false,
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            build: {
                files: {
                    'mopidy_spotmop/static/assets/css/style.min.css': ['mopidy_spotmop/static/assets/css/style.css']
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            build: {
                files: {
                    'mopidy_spotmop/static/app.js': ['mopidy_spotmop/static/app.js']
                }
            }
        },
        copy: {
            build: {
                cwd: 'src',
                src: ['**/*', '!**/*.css', '!**/*.js', '!index.html', '!vendor'],
                dest: 'mopidy_spotmop/static',
                expand: true
            },
        },
        processhtml: {
            options: {
                // Task-specific options go here. 
            },
            build: {
                files: {
                    'mopidy_spotmop/static/index.html': ['src/index.html']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-processhtml');

    // Default task(s).
    grunt.registerTask('default', ['copy', 'concat', 'ngAnnotate', 'uglify', 'cssmin', 'processhtml']);

};
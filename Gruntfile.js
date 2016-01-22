module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: ['src/vendor/jquery.min.js','src/vendor/angular.js','src/vendor/*.js','src/app/app.js','src/app/**/*.js'],
                dest: 'build/app.js'
            },
            css: {
                src: 'src/assets/css/*.css',
                dest: 'build/assets/css/style.css'
            }
        },
        uglify: {
            options: {
                banner: '/**\n * <%= pkg.name %>\n * Built <%= grunt.template.today("yyyy-mm-dd") %>\n **/\n\n'
            },
            build: {
                src: 'build/app.js',
                dest: 'build/app.min.js'
            }
        },
        cssmin: {
            options: {
                processImport: false,
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'build/assets/css/style.min.css': ['build/assets/css/style.css']
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'build/app.js': ['build/app.js']
                }
            }
        },
        copy: {
            files: {
                cwd: 'src',
                src: ['**/*', '!**/*.css', '!**/*.js', '!index.html'],
                dest: 'build',
                expand: true
            },
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s).
    grunt.registerTask('default', ['copy', 'concat', 'ngAnnotate', 'uglify', 'cssmin']);

};
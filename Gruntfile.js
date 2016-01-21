module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                src: 'src/**/*.js',
                dest: 'mopidy_spotmop/static/app.js'
            },
            css: {
                src: 'src/assets/css/*.css',
                dest: 'mopidy_spotmop/static/assets/style.css'
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
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

};
/**
 * Created by viatsyshyn on 10/28/15.
 */

module.exports = function(grunt) {

    grunt.initConfig({
        compass: {
            dist: {
                options: {
                    config: 'config.rb',
                    environment: 'production'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compass');

    grunt.registerTask('default', ['']);

    grunt.registerTask('heroku', ['compass']);

};
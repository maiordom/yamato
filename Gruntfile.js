module.exports = function( grunt ) {
    'use strict';

    grunt.initConfig({
        watch: {
            js: {
                files: [ 'src/*.js' ],
                tasks: [ 'replace:js' ]
            }
        },
        replace: {
            js: {
                options: {
                    patterns: [{
                        json: {
                            UploadQueue: '<%= grunt.file.read("src/Yamato.UploadQueue.js") %>',
                            Config:      '<%= grunt.file.read("src/Yamato.Config.js") %>',
                            Canvas:      '<%= grunt.file.read("src/Yamato.Canvas.js") %>',
                            Iframe:      '<%= grunt.file.read("src/Yamato.Iframe.js") %>',
                            Multi:       '<%= grunt.file.read("src/Yamato.Multi.js") %>',
                            Xhr:         '<%= grunt.file.read("src/Yamato.Xhr.js") %>',
                            DropZone:    '<%= grunt.file.read("src/Yamato.DropZone.js") %>',
                            Flash:       '<%= grunt.file.read("src/Yamato.Flash.js") %>',
                            Manager:     '<%= grunt.file.read("src/Yamato.Manager.js") %>'
                        }
                    }]
                },
                files: [{
                    src: 'src/Yamato.Core.js',
                    dest: 'examples/Yamato.js'
                }]
            }
        }
    });

    grunt.loadNpmTasks( 'grunt-replace' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.registerTask( 'default', [ 'replace', 'watch' ] );
};
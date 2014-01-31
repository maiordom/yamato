var Manager = function( el, settings, engineType ) {
    var uploadEngine, dropZone, activeProgress, activeProgressLine, nodes = {}, fileFldId, photoPrefix = 'yamato-id-', photoIndexRegExp = '\\d+';

    var f = {
        init: function() {
            f.cacheObjects();
            f.setEngine();
        },

        setEngine: function() {
            /* debug mode=on */
            switch( engineType ) {
                case 'flash':  f.setFlashEngine();  return;
                case 'html5':  f.setHTML5Engine();  return;
                case 'iframe': f.setIframeEngine(); return;
            }

            /* detect available engine */
            if ( Yamato.Xhr && Yamato.Xhr.isAvailable() ) {
                f.setHTML5Engine();
            } else if ( Yamato.Flash && Yamato.Flash.isAvailable() ) {
                f.setFlashEngine();
            } else {
                f.setIframeEngine();
            }
        },

        setHTML5Engine: function() {
            engineType = 'html5';
            f.setMultiUpload();
            f.setCounterToUploadEngine();
            f.checkPhotosCount();
            f.setMultiHandler();

            f.bindMultiUploadEvents();
            f.bindErrorEvents();
        },

        setFlashEngine: function() {
            engineType = 'flash';
            f.setFlashUpload();
            f.checkPhotosCount();

            f.bindMultiUploadEvents();
            f.bindFlashEvents();
            f.bindErrorEvents();
        },

        setIframeEngine: function() {
            engineType = 'iframe';
            f.setSingleUpload();
            f.setCounterToUploadEngine();
            f.checkPhotosCount();

            f.bindSingleUploadEvents();
        },

        cacheObjects: function() {
            nodes = {
                el:      el,
                box:     el.find( '.yamato-items' ),
                btn:     el.find( '.yamato-button' ),
                fileFld: el.find( '.yamato-file-input' ),
                fileRow: el.find( '.yamato-file-box' ),
                fileRowClone: el.find( '.yamato-file-box' ).clone()
            };

            fileFldId = nodes.fileFld.attr( 'id' );
        },

        setFlashUpload: function() {
            var fileWrapper = el.find( '.yamato-file-box' ),
                fileField   = el.find( '.yamato-file-input' );

            nodes.box.find( '.yamato-items' ).each( function() {
                var photo = $( this ),
                    id = f.getIndexPhoto( photo );

                photo.attr( 'id', 'SWFUpload_0_' + ( parseInt( id, 10 ) + 1000000 ) );
            });

            photoPrefix = '';
            photoIndexRegExp = 'SWFUpload_\\d+_\\d+';
            fileField.insertAfter( fileWrapper );
            fileWrapper.remove();

            settings._tmpl = settings.tmpl;
            settings.tmpl  = settings.flashConfig.itemTemplate;
            settings.flashConfig.uploader = settings.uploadUrl;

            uploadEngine = Yamato.Flash({
                box:     nodes.box,
                el:      fileField,
                fConfig: settings.flashConfig,
                config:  settings,
                render:  f.renderPhoto,
                type:    Yamato.Config.multiType
            });

            nodes.btn = el.find( '.yamato-button' );
            el.find( '.uploadify-queue' ).appendTo( nodes.box );
        },

        setSingleUpload: function() {
            var props = {
                btn:    nodes.btn,
                id:     nodes.fileFld.attr( 'id' ),
                loader: nodes.el.find( '.yamato-loader' ),
                url:    settings.uploadUrl
            };

            uploadEngine = Yamato.Iframe( props );
        },

        setMultiUpload: function() {
            var props = {
                box:     nodes.box,
                fileFld: nodes.fileFld,
                url:     settings.uploadUrl,
                config:  settings,
                render:  f.renderPhoto,
                type:    Yamato.Config.multiType
            };

            uploadEngine = Yamato.Multi( props );
        },

        setMultiHandler: function() {
            nodes.fileFld.off( 'change' ).on( 'change', f.onSelectFiles );
            nodes.fileFld.attr( 'multiple', true );
        },

        bindFlashEvents: function() {
            uploadEngine.on( flashEvent.select, function() {
                f.clearOuterError();
                if ( !f.checkPhotosCount() ) {
                    uploadEngine.disable( true );
                } else {
                    uploadEngine.disable( false );
                }
            });
        },

        bindSingleUploadEvents: function() {
            uploadEngine.on( xhrEvent.complete, function( e, json, index ) {
                if ( json.error ) {
                    f.showOuterError( json.error );
                } else {
                    var data = {
                        w:     settings.thumbWidth,
                        h:     settings.thumbHeight,
                        index: index,
                        src:   json.types[ settings.thumbType ].url
                    };

                    nodes.fileFld = $( '#' + fileFldId );
                    var photo = f.renderPhoto( data );
                    photo.find( '.yamato-progress' ).hide();
                    f.enablePhoto( index, json.value );
                    f.findPrimary();
                    f.clearOuterError();
                    f.checkPhotosCount();
                }
            });

            uploadEngine.on( xhrEvent.error, function() {
                f.showOuterError( managerMsg.serverError );
            });
        },

        bindMultiUploadEvents: function() {
            uploadEngine.on( xhrEvent.complete, function( e, index, json ) {
                if ( json.result === 'RESULT_OK' ) {
                    f.enablePhoto( index, json.value );
                } else {
                    f.showInnerError( index, json.error );
                }

                f.hideProgress();
            });

            uploadEngine.on( xhrEvent.error, function( e, index ) {
                f.hideProgress();
                f.showInnerError( index, managerMsg.serverError );
            });

            uploadEngine.on( uploadEvent.start, function( e, index ) {
                var photo = f.getPhoto( index );
                activeProgress = photo.find( '.yamato-progress' ).show();
                activeProgressLine = activeProgress.find( '.yamato-progress-bar' ).width( 0 );
            });

            uploadEngine.on( uploadEvent.progress, function( e, index, total, progress ) {
                activeProgressLine.stop().animate({
                    width: settings.progressWidth * progress / total
                }, 200 * progress / total );
            });
        },

        bindErrorEvents: function() {
            uploadEngine.on( multiEvent.error, function( e, data ) {
                switch( data.result ) {
                    case multiType.errorMaxFileCount: { f.showOuterError( managerMsg.maxFilesCount );        } break;
                    case multiType.errorImgSize:      { f.showInnerError( data.index, managerMsg.imgSize );  } break;
                    case multiType.errorFileSize:     { f.showInnerError( data.index, managerMsg.fileSize ); } break;
                    case multiType.errorImgType:      { f.showInnerError( data.index, managerMsg.imgType );  } break;
                    case multiType.errorCantRead:     { f.showInnerError( data.index, managerMsg.cantRead ); } break;
                }
            });
        },

        enablePhoto: function( index, value ) {
            f.getPhoto( index )
                .removeClass( 'yamato-processing' ).addClass( 'yamato-ready' );
        },

        hideProgress: function() {
            activeProgress.hide();
            activeProgressLine.width( 0 );
        },

        renderPhoto: function( data ) {
            return f.getTmpl( data ).appendTo( nodes.box );
        },

        onDropFiles: function( e ) {
            var files = e.originalEvent.dataTransfer.files;
            f.appendFiles( files );
        },

        setCounterToUploadEngine: function() {
            var els = nodes.box.find( '.yamato-item' ), index, indexes = [ -1 ];

            els.each( function() {
                index = f.getIndexPhoto( $( this ) );
                indexes.push( index );
            });

            index = Math.max.apply( Math, indexes );
            uploadEngine.setCounter( els.length );
            uploadEngine.setGlobalIndex( index );
        },

        getIndexPhoto: function( el ) {
            return new RegExp( photoIndexRegExp, 'gi' ).exec( el.attr( 'id' ) )[ 0 ];
        },

        getPhoto: function( index ) {
            return nodes.box.find( '#' + photoPrefix + index );
        },

        onSelectFiles: function( e ) {
            f.appendFiles( e.target.files );
            this.value = '';
        },

        appendFiles: function( files ) {
            uploadEngine.readTarget( files );
            f.checkPhotosCount();
        },

        checkPhotosCount: function() {
            if ( uploadEngine.getCounter() === settings.maxFilesCount ) {
                nodes.btn.addClass( 'yamato-dark' );
                nodes.fileFld.hide();
                return false;
            } else {
                nodes.btn.removeClass( 'yamato-dark' );
                nodes.fileFld.show();
                return true;
            }
        },

        getTmpl: function( data ) {
            var tmpl = settings.tmpl, box;
            tmpl = tmpl.replace( /\$\{fileID\}/gi, data.index );
            tmpl = tmpl.replace( /\$\{w\}/gi, data.w );
            tmpl = tmpl.replace( /\$\{h\}/gi, data.h );
            box  = $( tmpl );

            if ( $.browser.msie && parseInt( $.browser.version, 10 ) === 7 ) {
                box[ 0 ].style.width = settings.thumbWidth + 'px';
                box.find( '.js-upload-img' ).height( data.h );
            }

            if ( data.src ) {
                f.insertPhotoImgToTmpl( data, box[ 0 ] );
            }

            return box;
        },

        insertPhotoImgToTmpl: function( data, box ) {
            var photoBox    = $( box ),
                photoImg    = photoBox.find( '.yamato-img' ),
                newPhotoImg = new Image( data.w, data.h );

            newPhotoImg.src = data.src;
            $( newPhotoImg ).insertAfter( photoImg ).addClass( photoImg.attr( 'class' ) );
            photoImg.remove();
        },

        destroy: function() {
            nodes.fileRowClone.insertAfter( nodes.fileRow );
            nodes.fileRow.remove();
            uploadEngine.destroy();
            nodes.el.removeData( 'uploader' );
            nodes.box.off();

            if ( dropZone ) { dropZone.destroy(); }

            if ( engineType === 'flash' ) {
                settings.tmpl = settings._tmpl;
                delete settings._tmpl;

                nodes.box.find( '.yamato-item' ).each( function() {
                    var item = $( this ),
                        id = item.attr( 'id' ), index;

                    index = new RegExp( 'SWFUpload_0_(\\d+)', 'gi' ).exec( id )[ 1 ];
                    index = index.substr( 1, index.length - 1 );
                    index = parseInt( index, 10 );
                    item.attr( 'id', 'yamato-id-' + index );
                });
            }
        },

        showInnerError: function() {

        }
    };

    f.init();

    return {
        destroy: f.destroy
    };
};

Yamato.Manager = Manager;
var UploadManager = function( el, engineType ) {
    var uploadEngine, dropZone, activeProgress, activeProgressLine, nodes = {}, fileFldId, config = {}, photoPrefix = 'js-upload-photo-', photoIndexRegExp = '\\d+';

    var f = {
        init: function() {
            f.cacheObjects();
            f.readElData();

            /* debug mode=on */
            switch( engineType ) {
                case 'flash':  f.setFlashEngine();  return;
                case 'html5':  f.setHTML5Engine();  return;
                case 'iframe': f.setIframeEngine(); return;
            }

            /* detect available engine */
            if ( AM.Upload.File.isAvailable() ) {
                f.setHTML5Engine();
            } else if ( AM.Upload.Flash.isAvailable() ) {
                f.setFlashEngine();
            } else {
                f.setIframeEngine();
            }
        },

        setHTML5Engine: function() {
            engineType = 'html5';
            f.setMultiUpload();
            f.setCounterToUploadEngine();
            f.setCounterToDropZone();
            f.checkPhotosCount();
            f.setDropZone();
            f.setMultiHandler();

            f.bindPhotoEvents();
            f.bindMultiUploadEvents();
            f.bindErrorEvents();
        },

        setFlashEngine: function() {
            engineType = 'flash';
            f.setFlashUpload();
            f.checkPhotosCount();

            f.bindPhotoEvents();
            f.bindMultiUploadEvents();
            f.bindFlashEvents();
            f.bindErrorEvents();
        },

        setIframeEngine: function() {
            engineType = 'iframe';
            f.setSingleUpload();
            f.setCounterToUploadEngine();
            f.checkPhotosCount();

            f.bindPhotoEvents();
            f.bindSingleUploadEvents();
        },

        cacheObjects: function() {
            nodes = {
                el:      el,
                errFld:  el.find( '.au-form-field-errors' ),
                dz:      el.find( '.au-form-dropzone' ),
                dzBody:  el.find( '.au-form-dropzone-body' ),
                box:     el.find( '.js-form-photos-photos' ),
                row:     el.find( '.js-form-photos-photos-row' ),
                btn:     el.find( '.js-form-photos-button' ),
                fileFld: el.find( '.js-form-photos-file' ),
                fileRow: el.find( '.js-form-photos-file-row' ),
                fileRowClone: el.find( '.js-form-photos-file-row' ).clone()
            };

            fileFldId = nodes.fileFld.attr( 'id' );
        },

        readElData: function() {
            var configName       = el.data( 'config' );
            config               = AM.Upload.Config[ configName ];
            config.maxFilesCount = nodes.el.data( 'maxFilesCount' );
            config.maxFileSize   = nodes.el.data( 'maxFileSize' );
            config.primary       = nodes.el.data( 'primary' );
            config.url           = 'http://' + location.host + '/' + nodes.el.data( 'url' );
        },

        setFlashUpload: function() {
            var fileWrapper = el.find( '.js-form-file-wrapper' ),
                fileField   = el.find( '.js-form-photos-file' );

            nodes.box.find( '.js-form-photos-photo' ).each( function() {
                var photo = $( this ),
                    id = f.getIndexPhoto( photo );

                photo.attr( 'id', 'SWFUpload_0_' + ( parseInt( id, 10 ) + 1000000 ) );
            });

            photoPrefix = '';
            photoIndexRegExp = 'SWFUpload_\\d+_\\d+';
            fileField.insertAfter( fileWrapper );
            fileWrapper.remove();

            config._tmpl = config.tmpl;
            config.tmpl  = config.flashConfig.itemTemplate;
            config.flashConfig.uploader = config.url;

            uploadEngine = AM.Upload.Flash({
                box:     nodes.box,
                el:      fileField,
                fConfig: config.flashConfig,
                config:  config,
                render:  f.renderPhoto,
                type:    AM.Upload.Config.multiType
            });

            nodes.btn = el.find( '.js-form-photos-button' );
            el.find( '.uploadify-queue' ).appendTo( nodes.box );
        },

        setSingleUpload: function() {
            var props = {
                btn:    nodes.btn,
                id:     nodes.fileFld.attr( 'id' ),
                loader: nodes.el.find( '.js-form-photos-loader' ),
                url:    config.url
            };

            uploadEngine = AM.Upload.Iframe( props );
        },

        setMultiUpload: function() {
            var props = {
                box:     nodes.box,
                fileFld: nodes.fileFld,
                url:     config.url,
                config:  config,
                render:  f.renderPhoto,
                type:    AM.Upload.Config.multiType
            };

            uploadEngine = AM.Upload.Multi( props );
        },

        setDropZone: function() {
            /* bug with ie version 10.0.9200.16660, waiting for version update */
            if ( $.browser.msie && parseInt( $.browser.version, 10 ) === 10 ) {
                return false;
            }

            if ( !( 'draggable' in document.createElement( 'span' ) ) ) {
                return;
            }

            if ( el.data().dragAndDropTooltip ) {
                el.find( '.js-upload-tooltip' ).html( el.data().dragAndDropTooltip );
            }

            dropZone = AM.Upload.DropZone({
                el: nodes.dz,
                actCls: 'au-form-dropzone-act',
                onDropFiles: f.onDropFiles
            });
        },

        setMultiHandler: function() {
            nodes.fileFld.off( 'change' ).on( 'change', f.onSelectFiles );
            nodes.fileFld.attr( 'multiple', true );
        },

        bindPhotoEvents: function() {
            if ( config.primary === true ) {
                nodes.box.on( 'click',  '.js-form-photos-setmain', f.onSelectPhotoByLink );
                nodes.box.on( 'change', '.js-form-photos-main',    f.onSelectPhotoByRadio );
            }

            nodes.box.on( 'click', '.js-form-photos-delete', f.onRemovePhoto );
            nodes.box.on( 'click', '.js-form-photos-rotate', f.onRotatePhoto );
        },

        bindFlashEvents: function() {
            uploadEngine.on( flashEvent.select, function() {
                nodes.row.show();
                f.clearOuterError();
                if ( !f.checkPhotosCount() ) {
                    uploadEngine.disable( true );
                } else {
                    uploadEngine.disable( false );
                }
            });

            nodes.box.on( 'click', '.js-form-photos-delete', function() {
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
                        w:     config.thumbWidth,
                        h:     config.thumbHeight,
                        index: index,
                        src:   json.types[ config.thumbType ].url
                    };

                    nodes.row.show();
                    nodes.fileFld = $( '#' + fileFldId );
                    var photo = f.renderPhoto( data );
                    photo.find( '.au-form-progress' ).hide();
                    f.enablePhoto( index, json.value );
                    f.enableRotate( index );
                    f.updateFormProgress( index, true );
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
                if ( json.value ) {
                    f.enablePhoto( index, json.value );
                    f.enableRotate( index );
                    f.updateFormProgress( index, true );
                    f.findPrimary();
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
                var photo = f.getPhoto( index ).removeClass( 'au-form-photo-mask' );
                activeProgress = photo.find( '.au-form-progress' ).show();
                activeProgressLine = activeProgress.find( '.au-form-progress-line' ).width( 0 );
            });

            uploadEngine.on( uploadEvent.progress, function( e, index, total, progress ) {
                activeProgressLine.stop().animate({
                    width: config.progressWidth * progress / total
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

        hideProgress: function() {
            activeProgress.hide();
            activeProgressLine.width( 0 );
        },

        renderPhoto: function( data ) {
            return f.getTmpl( data ).appendTo( nodes.box );
        },

        prepareToRotate: function( photo ) {
            photo.removeClass( 'js-form-photo-ready' );
            photo.find( '.au-form-progress' ).show();
            photo.find( '.au-form-progress-line' ).width( 0 );
            photo.addClass( 'au-form-photo-mask' );

            if ( photo.hasClass( 'primary' ) ) {
                photo.removeClass( 'primary' );
                photo.find( '.js-form-photos-main' ).prop( 'disabled', true ).prop( 'checked', false );
                f.findPhotoForPrimary( photo );
            }
        },

        onRotatePhoto: function() {
            var photo = $( this ).closest( '.js-form-photos-photo' ),
                index = f.getIndexPhoto( photo );

            f.prepareToRotate( photo );
            uploadEngine.rotate( index );
            return false;
        },

        onDropFiles: function( e ) {
            var files = e.originalEvent.dataTransfer.files;
            f.appendFiles( files );
            f.setCounterToDropZone();
        },

        setCounterToUploadEngine: function() {
            var els = nodes.box.find( '.js-form-photos-photo' ), index, indexes = [ -1 ];

            els.each( function() {
                index = f.getIndexPhoto( $( this ) );
                indexes.push( index );
            });

            index = Math.max.apply( Math, indexes );
            uploadEngine.setCounter( els.length );
            uploadEngine.setGlobalIndex( index );
        },

        setCounterToDropZone: function() {
            var counter = uploadEngine.getCounter(),
                rest = config.maxFilesCount - counter;

            if ( counter === config.maxFilesCount ) {
                nodes.dzBody.text( 'Вы достигли лимита фотографий' );
            } else if ( counter === config.maxFilesCount - 1 ) {
                nodes.dzBody.text( 'Не больше 1 штуки' );
            } else {
                nodes.dzBody.text( 'Не больше ' + rest + ' штук' );
            }
        },

        onRemovePhoto: function( e ) {
            var photo = $( this ).closest( '.js-form-photos-photo' );
            f.checkPhotosCount();
            e.preventDefault();
            e.stopPropagation();
        },

        getIndexPhoto: function( el ) {
            return new RegExp( photoIndexRegExp, 'gi' ).exec( el.attr( 'id' ) )[ 0 ];
        },

        getPhoto: function( index ) {
            return nodes.box.find( '#' + photoPrefix + index );
        },

        enablePhoto: function( index, value ) {
            var photoBox = f.getPhoto( index ),
                photoValue = photoBox.find( '.js-upload-value' );

            photoBox.removeClass( 'js-form-photo-processing au-form-photo-mask' ).addClass( 'js-form-photo-ready' );
            photoBox.find( '.js-form-photos-main' ).prop( 'disabled', false );
            photoValue.val( value );
        },

        removePhoto: function( photo, callback ) {
            var index = f.getIndexPhoto( photo );
            uploadEngine.removeFile( index );
            photo.addClass( 'js-form-photo-removed' );
            photo.fadeOut( function() {
                photo.remove();
                if ( callback ) { callback(); }
            });
        },

        onSelectFiles: function( e ) {
            f.appendFiles( e.target.files );
            f.setCounterToDropZone();
            this.value = '';
        },

        appendFiles: function( files ) {
            uploadEngine.readTarget( files );
            f.checkPhotosCount();
        },

        checkPhotosCount: function() {
            if ( uploadEngine.getCounter() === config.maxFilesCount ) {
                nodes.btn.addClass( 'au-button-dark' );
                nodes.fileFld.hide();
                return false;
            } else {
                nodes.btn.removeClass( 'au-button-dark' );
                nodes.fileFld.show();
                return true;
            }
        },

        getTmpl: function( data ) {
            var tmpl = config.tmpl, box;
            tmpl = tmpl.replace( /\$\{fileID\}/gi, data.index );
            tmpl = tmpl.replace( /\$\{w\}/gi, data.w );
            tmpl = tmpl.replace( /\$\{h\}/gi, data.h );
            box  = $( tmpl );

            if ( $.browser.msie && parseInt( $.browser.version, 10 ) === 7 ) {
                box[ 0 ].style.width = config.thumbWidth + 'px';
                box.find( '.js-upload-img' ).height( data.h );
            }

            if ( data.src ) {
                f.insertPhotoImgToTmpl( data, box[ 0 ] );
            }

            return box;
        },

        insertPhotoImgToTmpl: function( data, box ) {
            var photoBox    = $( box ),
                photoImg    = photoBox.find( '.js-upload-img' ),
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
                config.tmpl = config._tmpl;
                delete config._tmpl;

                nodes.box.find( '.js-form-photos-photo' ).each( function() {
                    var item = $( this ),
                        id = item.attr( 'id' ), index;

                    index = new RegExp( 'SWFUpload_0_(\\d+)', 'gi' ).exec( id )[ 1 ];
                    index = index.substr( 1, index.length - 1 );
                    index = parseInt( index, 10 );
                    item.attr( 'id', 'js-upload-photo-' + index );
                });
            }
        }
    };

    f.init();

    return {
        destroy: f.destroy
    };
};

$.fn.Yamato = function( options ) {
    $( this ).each( function() {
        var item = $( this ), entity;

        if ( item.data( 'Yamato' ) ) {
            console.log( 'Yamato on this node already initialized', this );
        } else {
            entity = Yamato( item, options || {} );
            item.data( 'Yamato', entity );
        }
    });
};
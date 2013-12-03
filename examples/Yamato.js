(function( $, root, undefined ) {

'use strict';

var Yamato = {};

var Config = {
    debug: false,
    engineType: null, /* html5 | flash | iframe */

    xhrEvent: {
        complete: 'onXHRComplete',
        abort:    'onXHRAbort',
        error:    'onXHRError'
    },

    xhrType: {
        resultLoad:          'RESULT_LOAD',
        resultComplete:      'RESULT_COMPLETE',
        errorRequestTimeout: 'ERROR_REQUEST_TIMEOUT',
        errorParseJson:      'ERROR_PARSE_JSON',
        errorSome:           'ERROR_ERROR'
    },

    uploadType: {
        resultLoad: 'RESULT_LOAD',
        errorAbort: 'ERROR_UPLOAD_ABORT',
        errorSome:  'ERROR_UPLOAD_ERROR'
    },

    uploadEvent: {
        load:     'onUploadLoad',
        abort:    'onUploadAbort',
        error:    'onUploadError',
        progress: 'onUploadProgress',
        start:    'onUploadStart',
        end:      'onUploadEnd'
    },

    multiEvent: {
        error: 'onMultiError'
    },

    flashEvent: {
        select: 'onFlashSelect'
    },

    multiType: {
        errorMaxFileCount: 'ERROR_MAX_FILE_COUNT',
        errorFileSize:     'ERROR_FILE_SIZE',
        errorImgType:      'ERROR_IMG_TYPE',
        errorImgSize:      'ERROR_IMG_SIZE',
        errorCantRead:     'ERROR_CANT_READ',
        resultOk:          'RESULT_OK'
    },

    settings: {
        rotateUrl:      'api/rotate-image/',
        url:            'api/upload-file/',
        imgTypePattern: 'png|gif|jpg|jpeg',
        primary:        true,
        maxFileSize:    20,
        fileSizeDim:    1024 * 1024,
        maxFilesCount:  12,
        minImgWidth:    350,
        minImgHeight:   285,
        progressWidth:  122,
        thumbWidth:     147,
        thumbHeight:    120,
        thumbType:      'large',
        outerErrorTmpl: '<label class="au-form-error serverside">${msg}</label>',
        tmpl:
        '<div id="js-upload-photo-${fileID}" class="au-form-photo-mask au-form-input au-form-photo js-form-photos-photo js-form-photo-processing">\
            <a class="au-form-photo-inner au-form-photo-link au-none js-form-photos-setmain" href="#" title="Сделать фото основным">\
                <div class="js-form-photos-rotate au-photo-rotate"></div>\
                <div class="uploadify-progress au-form-progress">\
                    <div class="uploadify-progress-bar au-form-progress-line"></div>\
                </div>\
                <div class="au-form-img js-upload-img" style="width: ${w}px; height: ${h}px; background: #999;"></div>\
            </a>\
            <input class="js-upload-value" name="photos[${fileID}][url]" type="hidden" value="null">\
            <input class="radio js-form-photos-main" name="mainphoto" disabled type="radio" id="photo${fileID}" value="${fileID}">\
            <label for="photo${fileID}">основное фото</label>\
            <a class="au-form-photo-remove au-click au-grey js-form-photos-delete" href="#">\
                <span>Удалить</span>\
            </a>\
        </div>',

        flashConfig: {
            thumbWidth: 147,
            thumbHeight: 120,
            width: 121,
            height: 26,
            buttonClass: 'js-form-photos-button',
            buttonText: '' +
            '<button class="js-form-photos-button au-button au-button-grey" type="button">\
                <span>Добавить фото</span>\
            </button>',
            fileObjName: 'image',
            fileSizeLimit: '20mb',
            swf: '/shared/js/ext/uploadify/uploadify.swf',
            uploader: null,
            fileTypeExts: '*.gif; *.jpg; *.png; *.jpeg;',
            removeCompleted: false,
            uploadLimit: 12,
            itemTemplate: ''
        }
    }
};

var uploadType  = Config.uploadType,
    uploadEvent = Config.uploadEvent,
    xhrEvent    = Config.xhrEvent,
    xhrType     = Config.xhrType,
    multiEvent  = Config.multiEvent;

var CanvasUtil = function( config ) {
    var f = {
        rotateImg: function( img, angle, callback ) {
            var canvas = document.createElement( 'canvas' ),
                ctx    = canvas.getContext( '2d' ), w, h, cW, cH, offset;

            w = cW = img.width;
            h = cH = img.height;
            offset = 0;

            if ( angle === 90 || angle === 270 ) {
                cW = h;
                cH = w;
            }

            if ( angle === 90 ) {
                offset = ( w - h ) / 2;
            } else if ( angle == 270 ) {
                offset = - ( w - h ) / 2;
            }

            canvas.setAttribute( 'width', cW );
            canvas.setAttribute( 'height', cH );
            ctx.translate( w / 2, h / 2 );
            ctx.rotate( angle * Math.PI / 180 );
            ctx.drawImage( img, - w / 2 + offset , - h / 2 + offset );

            var src = canvas.toDataURL(),
                nImg = new Image( cW, cH );

            nImg.onload = function() {
                callback( this, src );
            };
            nImg.src = src;
        },

        resizeImgToThumb: function( img, callback ) {
            var canvas = document.createElement( 'canvas' ),
                ctx    = canvas.getContext( '2d' ),
                ratio  = img.width / img.height, newImg, w, h, destWidth, destHeight, dx = 0, dy = 0;

            w = destWidth  = config.thumbWidth;
            h = destHeight = config.thumbHeight;

            if ( ratio === 1 ) {
                destWidth = destHeight = w;
                if ( w > h ) {
                    dy = ( w - h ) / 2;
                } else if ( w < h ) {
                    dx = ( w - h ) / 2;
                }
            } else if ( ratio > 1 ) {
                destWidth  = h * ratio;
                dx         = destWidth / 2 - w / 2;
            } else if ( ratio < 1 ) {
                destHeight = w / ratio;
                dy         = destHeight / 2 - h / 2;
            }

            canvas.setAttribute( 'width', w );
            canvas.setAttribute( 'height', h );

            ctx.drawImage( img, 0, 0, img.width, img.height, - dx, - dy, destWidth, destHeight );

            newImg = new Image( w, h );
            newImg.onload = function() {
                callback( this );
            };
            newImg.src = canvas.toDataURL();
        },

        resizeSrcImg: function( img, callback ) {
            var canvas     = document.createElement( 'canvas' ),
                ctx        = canvas.getContext( '2d' ),
                ratio      = img.width / img.height,
                thumbRatio = config.thumbWidth / config.thumbHeight, w, h, newImg, destWidth, destHeight, dx = 0, dy = 0;

            w = destWidth  = config.thumbWidth;
            h = destHeight = config.thumbWidth;

            if ( ratio > 1 ) {
                w          = config.thumbWidth * thumbRatio;
                h          = config.thumbWidth;
                destWidth  = h * ratio;
                destHeight = h;
                dx         = destWidth / 2 - w / 2;
            } else if ( ratio < 1 ) {
                w          = config.thumbWidth;
                h          = config.thumbWidth * thumbRatio;
                destWidth  = w;
                destHeight = w / ratio;
                dy         = destHeight / 2 - h / 2;
            }

            canvas.setAttribute( 'width',  w );
            canvas.setAttribute( 'height', h );
            ctx.drawImage( img, 0, 0, img.width, img.height, - dx, - dy, destWidth, destHeight );

            newImg = new Image( w, h );
            newImg.onload = function() {
                callback( this );
            };
            newImg.src = canvas.toDataURL();
        }
    };

    return f;
};

Yamato.CanvasUtil = CanvasUtil;

var xhrTimeout  = 30000;

var Xhr = function( props ) {
    var xhrTimeoutCallback, xhr, event = $( {} );

    xhr = {
        abort: function() {}
    };

    var f = {
        setData: function( data ) {
            props.data = data;
        },

        prepareXHRData: function( data ) {
            var formData = new FormData();

            for ( var i in data ) {
                formData.append( i, data[ i ] );
            }

            return formData;
        },

        send: function() {
            xhr = new XMLHttpRequest();
            f.setAbortTimer();
            f.bindXhrEvents();
            f.bindUploadEvents();
            xhr.open( 'POST', props.url, true );
            xhr.send( f.prepareXHRData( props.data ) );
        },

        bindXhrEvents: function() {
            xhr.onreadystatechange = f.onReadyStateChange;
            xhr.onerror = f.onXHRError;
        },

        bindUploadEvents: function() {
            xhr.upload.onabort     = f.onUploadAbort;
            xhr.upload.onerror     = f.onUploadError;
            xhr.upload.onload      = f.onUploadLoad;
            xhr.upload.onprogress  = f.onUploadProgress;
            xhr.upload.onloadstart = f.onUploadLoadStart;
            xhr.upload.onloadend   = f.onUploadLoadEnd;
        },

        onXHRError: function() {
            clearTimeout( xhrTimeoutCallback );
            f.trigger( xhrEvent.error, { result: xhrType.errorSome } );
        },

        onReadyStateChange: function() {
            if ( xhr.readyState === 4 ) {
                clearTimeout( xhrTimeoutCallback );

                if ( xhr.status === 200 ) {
                    try {
                        var json = JSON.parse( xhr.responseText );
                        f.trigger( xhrEvent.complete, json );
                    } catch( e ) {
                        f.trigger( xhrEvent.error, f.getErrorObj( xhrType.errorParseJson ) );
                    }
                } else {
                    f.trigger( xhrEvent.error, f.getErrorObj( xhrType.errorSome ) );
                }
            }
        },

        getErrorObj: function( result ) {
            return {
                status: xhr.status,
                statusText: xhr.statusText,
                result: result
            };
        },

        onUploadAbort: function() {
            f.trigger( uploadEvent.abort, { result: uploadType.errorAbort } );
        },

        onUploadError: function() {
            f.trigger( uploadEvent.error, { result: uploadType.errorSome } );
        },

        onUploadLoad: function() {
            f.trigger( uploadEvent.load, { result: uploadType.resultLoad } );
        },

        onUploadProgress: function( e ) {
            if ( e.lengthComputable ) {
                f.trigger( uploadEvent.progress, [ e.total, e.loaded ] );
            }
        },

        onUploadLoadStart: function() {
            f.trigger( uploadEvent.start );
        },

        onUploadLoadEnd: function() {
            f.trigger( uploadEvent.end );
        },

        setAbortTimer: function() {
            xhrTimeoutCallback = setTimeout( function() {
                xhr.abort();
                f.trigger( xhrEvent.error, f.getErrorObj( xhrType.errorRequestTimeout ) );
            }, xhrTimeout );
        },

        abort: function() {
            clearTimeout( xhrTimeoutCallback );
            xhr.abort();
        },

        trigger: function( eventName, data ) {
            event.trigger( eventName, data );
        },

        on: function( eventName, callback ) {
            event.on( eventName, callback );
        },

        off: function( eventName ) {
            event.off( eventName );
        }
    };

    return {
        on:      f.on,
        off:     f.off,
        abort:   f.abort,
        send:    f.send,
        setData: f.setData
    };
}

Xhr.isAvailable = function() {
    return 'FormData' in root && 'FileReader' in root;
};

Yamato.Xhr = Xhr;


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

window.Yamato = Yamato;

})( jQuery, window, undefined );
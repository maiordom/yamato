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

    managerMsg: {
        serverError:   'Произошла ошибка, попробуйте снова загрузить фотографию',
        makePrimary:   'Сделать основным фото',
        primary:       'Основное фото',
        maxFilesCount: 'Вы можете загрузить до 12 фотографий',
        fileSize:      'Вес фотографии превысил максимальный размер в 20мб',
        imgSize:       'Размер фотографии меньше минимального 350x285',
        imgType:       'Файл имеет недопустимый формат. Поддерживаемые форматы: JPG, PNG и GIF.',
        cantRead:      'Неудается отобразить фотографию',
        innerError:    'Не удалось загрузить некоторые файлы'
    },

    multiType: {
        errorMaxFileCount: 'ERROR_MAX_FILE_COUNT',
        errorFileSize:     'ERROR_FILE_SIZE',
        errorImgType:      'ERROR_IMG_TYPE',
        errorImgSize:      'ERROR_IMG_SIZE',
        errorCantRead:     'ERROR_CANT_READ',
        resultOk:          'RESULT_OK'
    }
};

Yamato.Config = Config;

var uploadType  = Config.uploadType,
    uploadEvent = Config.uploadEvent,
    xhrEvent    = Config.xhrEvent,
    xhrType     = Config.xhrType,
    multiType   = Config.multiType,
    multiEvent  = Config.multiEvent,
    managerMsg  = Config.managerMsg;


var Iframe = function( props ) {
    var counter = 0,
        globalIndex = 0,
        id      = props.id,
        btn     = props.btn,
        url     = props.url,
        loader  = props.loader,
        event   = $( {} );

    var f = {
        upload: function() {
            f.prepareUpload();
            f.send();
        },

        getIframeSetup: function() {
            return {
                url: url,
                secureuri: false,
                fileElementId: id,
                dataType: 'json',
                success: f.onSuccess,
                error: f.onError
            };
        },

        send: function() {
            $.ajaxFileUpload( f.getIframeSetup() );
        },

        onSuccess: function( data ) {
            f.refresh();
            ++globalIndex;
            ++counter;
            event.trigger( xhrEvent.complete, [ data, globalIndex ] );
        },

        onError: function() {
            f.refresh();
            event.trigger( xhrEvent.error );
        },

        prepareUpload: function() {
            loader.find( '.js-form-photos-loader-img' ).css( 'display', 'block' );
            btn.addClass( 'au-button-dark' );
            utils.forms.buttonDisable( btn );
            $( '#' + id ).hide();
        },

        refresh: function () {
            loader.find( '.js-form-photos-loader-img' ).hide();
            btn.removeClass( 'au-button-dark' );
            utils.forms.buttonEnable( btn );
            $( '#' + id ).show().change( function () {
                f.upload();
            });
        },

        on: function( eventName, callback ) {
            event.on( eventName, callback );
        },

        trigger: function( eventName, data ) {
            event.trigger( eventName, data );
        },

        removeFile: function() {
            --counter;
        },

        getCounter: function() {
            return counter;
        },

        setCounter: function( val ) {
            counter = val;
        },

        setGlobalIndex: function( val ) {
            globalIndex = val;
        },

        destroy: function() {
            $( '#' + id ).off( 'change' );
            event.off();
        },

        rotate: function( index ) {}
    };

    f.refresh();

    return {
        on:         f.on,
        destroy:    f.destroy,
        removeFile: f.removeFile,
        getCounter: f.getCounter,
        rotate:     f.rotate,
        setCounter: f.setCounter,
        setGlobalIndex: f.setGlobalIndex
    };
};

Yamato.Iframe = Iframe;
var UploadQueue = function( trigger ) {
    var queueArr = [], counter = 0;

    function _bind( func, entity ) {
        return function() {
            var args = [];
            for ( var i in arguments ) {
                args.push( arguments[ i ] );
            }
            args.push( entity );
            func.apply( null, args );
        };
    }

    var f = {
        destroy: function() {
            for ( var i = 0, len = queueArr.length; i < len; i++ ) {
                if ( queueArr[ i ].inProcess ) {
                    queueArr[ i ].abort();
                    queueArr[ i ].off();
                    break;
                }
            }

            queueArr = null;
        },

        remove: function( index ) {
            for ( var i = 0, len = queueArr.length; i < len; i++ ) {
                if ( queueArr[ i ].index === index ) {
                    queueArr[ i ].abort();
                    queueArr[ i ].off();
                    counter += queueArr[ i ].inProcess ? -1 : 0;
                    queueArr.splice( i, 1 );
                    break;
                }
            }
        },

        push: function( entity ) {
            queueArr.push( entity );
        },

        findEntity: function( index, callback ) {
            for ( var i = 0, len = queueArr.length; i < len; i++ ) {
                if ( queueArr[ i ].index === index ) {
                    callback( queueArr[ i ], i );
                    break;
                }
            }
        },

        getItem: function( index ) {
            var result;
            f.findEntity( index, function( item ) {
                result = item;
            });

            return result;
        },

        getNext: function() {
            for ( var i = 0, len = queueArr.length; i < len; i++ ) {
                if ( !queueArr[ i ].uploaded ) {
                    return queueArr[ i ];
                }
            }
        },

        bindEntityEvents: function( entity ) {
            entity.on( xhrEvent.complete,    _bind( f.onUploadComplete, entity ) );
            entity.on( xhrEvent.error,       _bind( f.onError, entity ) );
            entity.on( uploadEvent.start,    _bind( f.onUploadStart, entity ) );
            entity.on( uploadEvent.end,      _bind( f.onUploadEnd, entity ) );
            entity.on( uploadEvent.progress, _bind( f.onUploadProgress, entity ) );
        },

        start: function() {
            var entity = f.getNext();

            if ( !entity || counter > 0 ) { return; }

            f.bindEntityEvents( entity );

            ++counter;
            entity.send();
            entity.inProcess = true;
        },

        onError: function( e, json, entity ) {
            --counter;
            entity.inProcess = false;
            entity.uploaded = true;
            trigger( xhrEvent.error, [ entity.index, json ] );
            f.start();
        },

        onUploadComplete: function( e, json, entity ) {
            --counter;
            entity.inProcess = false;
            entity.uploaded = true;
            trigger( xhrEvent.complete, [ entity.index, json ] );
            f.start();
        },

        onUploadStart: function( e, entity ) {
            trigger( uploadEvent.start, [ entity.index ] );
        },

        onUploadEnd: function( e, entity ) {
            trigger( uploadEvent.end, [ entity.index ] );
        },

        onUploadProgress: function( e, total, progress, entity ) {
            trigger( uploadEvent.progress, [ entity.index, total, progress ] );
        }
    };

    return {
        getItem: f.getItem,
        remove:  f.remove,
        push:    f.push,
        start:   f.start,
        destroy: f.destroy
    };
};

Yamato.UploadQueue = UploadQueue;
/*
 @props.box     - thumbnails container
 @props.fileFld - file input field
 @props.url     - url to upload file
 @props.config  - uploader settings
 @props.render  - template engine
 @props.type    - predefined msgs
 */
var Multi = function( props ) {
    var globalIndex = -1,
        counter     = 0,
        event       = $( {} ),
        multiType   = props.type,
        multiConfig = props.config, uploadQueue, canvasUtil;

    var f = {
        init: function() {
            canvasUtil  = Yamato.CanvasUtil( multiConfig );
            uploadQueue = Yamato.UploadQueue( f.trigger );
        },

        checkFilesCount: function( files ) {
            return multiConfig.maxFilesCount < counter + files.length;
        },

        checkFileSize: function( file ) {
            return file.size / ( multiConfig.fileSizeDim ) > multiConfig.maxFileSize;
        },

        sliceFiles: function( files ) {
            var totalLength = counter + files.length,
                rest = totalLength - multiConfig.maxFilesCount, _files = [];

            for ( var i = 0, len = Math.abs( files.length - rest ); i < len; i++ ) {
                _files[ i ] = files[ i ];
            }
            return _files;
        },

        readTarget: function( files ) {
            if ( f.checkFilesCount( files ) ) {
                f.trigger( multiEvent.error, [ { result: multiType.errorMaxFileCount } ] );
                files = f.sliceFiles( files );
            }

            f.renderThumbnails( files );
        },

        validateFile: function( file ) {
            /* ie10 check */
            if ( !file.type && file.name.length ) {
                if ( !file.name.match( /(.png|.jpg|.gif|.jpeg)$/gi ) ) {
                    f.renderCap( f.getCapData( file.index ) );
                    f.trigger( multiEvent.error, [ { result: multiType.errorImgType, index: file.index } ] );
                    return;
                }
            } else if ( file.type.search( multiConfig.imgTypePattern ) === -1  ) {
                f.renderCap( f.getCapData( file.index ) );
                f.trigger( multiEvent.error, [ { result: multiType.errorImgType, index: file.index } ] );
                return;
            } else if ( f.checkFileSize( file ) ) {
                f.renderCap( f.getCapData( file.index ) );
                f.trigger( multiEvent.error, [ { result: multiType.errorFileSize, index: file.index } ] );
                return;
            }

            return true;
        },

        renderThumbnails: function( files ) {
            var file;
            for ( var i = 0, len = files.length; i < len; i++ ) {
                file = files[ i ];
                file.index = ++globalIndex;
                ++counter;

                if ( f.validateFile( file ) ) {
                    f.renderCap( f.getCapData( file.index ) );
                    var entityItem = f.createQueueItem( file );
                    uploadQueue.push( entityItem );
                    f.readFile( file, entityItem, f.onReadFile );
                }
            }
        },

        readFile: function( file, entityItem, callback ) {
            var reader = new FileReader();

            reader.onload = function( e ) {
                var srcImg = document.createElement( 'img' );

                srcImg.onload = function() {
                    canvasUtil.resizeSrcImg( this, function( resizedSrcImg ) {
                        callback( file, entityItem, srcImg, resizedSrcImg );
                    });
                };

                srcImg.onerror = function() {
                    callback( file, entityItem, null );
                };

                srcImg.src = e.target.result;
            };

            reader.onerror = function() {
                callback( file, entityItem, null );
            };

            reader.readAsDataURL( file );
        },

        onReadFile: function( file, entityItem, srcImg, resizedSrcImg ) {
            var index = file.index;

            if ( srcImg === null ) {
                f.trigger( multiEvent.error, [ { result: multiType.errorCantRead, index: index } ] );
                uploadQueue.remove( file.index );
            } else if ( !f.checkImgSize( srcImg ) ) {
                f.trigger( multiEvent.error, [ { result: multiType.errorImgSize, index: index } ] );
                uploadQueue.remove( file.index );
                canvasUtil.resizeImgToThumb( resizedSrcImg, function( thumb ) {
                    f.insertResizedImg( index, thumb );
                });
            } else {
                entityItem.srcImg = srcImg;
                entityItem.resizedSrcImg = resizedSrcImg;
                uploadQueue.start();

                canvasUtil.resizeImgToThumb( resizedSrcImg, function( thumb ) {
                    f.insertResizedImg( index, thumb );
                });
            }
        },

        getCapData: function( index ) {
            return {
                w:     multiConfig.thumbWidth,
                h:     multiConfig.thumbHeight,
                index: index
            };
        },

        renderCap: function( data ) {
            props.render( data );
        },

        insertResizedImg: function( index, newPhotoImg ) {
            var photoBox = props.box.find( '#yamato-id-' + index ),
                photoImg = photoBox.find( '.yamato-img' );

            $( newPhotoImg ).insertAfter( photoImg ).addClass( photoImg.attr( 'class' ) );
            photoImg.remove();
        },

        createQueueItem: function( file, srcImg, resizedSrcImg ) {
            var entity = Yamato.Xhr({
                data: { image: file },
                url: props.url
            });

            entity.file      = file;
            entity.index     = file.index;
            entity.rzdSrcImg = resizedSrcImg;
            entity.srcImg    = srcImg;
            entity.angle     = 0;
            entity.uploaded  = false;
            entity.inProcess = false;

            return entity;
        },

        checkImgSize: function( img ) {
            return img.width >= multiConfig.minImgWidth && img.height >= multiConfig.minImgHeight;
        },

        removeFile: function( index ) {
            --counter;
            uploadQueue.remove( parseInt( index ) );
            uploadQueue.start();
        },

        on: function( eventName, callback ) {
            event.on( eventName, callback );
        },

        trigger: function( eventName, data ) {
            event.trigger( eventName, data );
        },

        getCounter: function() {
            return counter;
        },

        setCounter: function( val ) {
            counter = val;
        },

        setGlobalIndex: function( val ) {
            globalIndex = val;
        },

        destroy: function() {
            props.fileFld.off( 'change' ).attr( 'multiple', false );
            event.off();
            uploadQueue.destroy();
        }
    };

    f.init();

    return {
        on:         f.on,
        removeFile: f.removeFile,
        getCounter: f.getCounter,
        setCounter: f.setCounter,
        rotate:     f.rotate,
        readTarget: f.readTarget,
        destroy:    f.destroy,
        setGlobalIndex: f.setGlobalIndex
    };
}

Multi.isAvailableCanvasRotate = function() {
    return !!document.createElement( 'canvas' ).getContext;
};

Yamato.Multi = Multi;
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

$.fn.Yamato = function( options ) {
    $( this ).each( function() {
        var item = $( this ), entity;

        if ( item.data( 'Yamato' ) ) {
            console.log( 'Yamato on this node already initialized', this );
        } else {
            entity = Yamato.Manager( item, options || {} );
            item.data( 'Yamato', entity );
        }
    });
};

})( jQuery, window, undefined );
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
}

/*
 @props.box     - thumbnails container
 @props.fileFld - file input field
 @props.url     - url to upload file
 @props.config  - uploader settings
 @props.render  - template engine
 @props.type    - predefined msgs
 */
var Multi = function( props ) {
    var globalIndex  = -1,
        counter      = 0,
        event        = $( {} ),
        multiType    = props.type,
        multiConfig  = props.config, uploadQueue, rotateQueue, canvasUtil;

    var f = {
        init: function() {
            canvasUtil  = CanvasUtil( multiConfig );
            uploadQueue = UploadQueue( f.trigger );
            rotateQueue = AM.Upload.RotateQueue( multiConfig.rotateUrl, f.trigger );
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
                if ( !file.name.match( new RegExp( '(.png|.jpg|.gif|.jpeg)$', 'gi' ) ) ) {
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
            var photoBox = props.box.find( '#js-upload-photo-' + index ),
                photoImg = photoBox.find( '.js-upload-img' );

            $( newPhotoImg ).insertAfter( photoImg ).addClass( photoImg.attr( 'class' ) );
            photoImg.remove();
        },

        createQueueItem: function( file, srcImg, resizedSrcImg ) {
            var entity = AM.Upload.File({
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

        rotate: function( _index ) {
            var index = parseInt( _index, 10 ),
                queueItem = uploadQueue.getItem( index );

            if ( queueItem ) {
                queueItem.angle += 90;
                queueItem.angle += queueItem.angle >= 360 ? - 360 : 0;

                canvasUtil.rotateImg( queueItem.rzdSrcImg, queueItem.angle, function( rotatedRzdSrcImg ) {
                    canvasUtil.resizeImgToThumb( rotatedRzdSrcImg, function( thumb ) {
                        f.insertResizedImg( index, thumb );
                    });
                });
            } else {
                queueItem = f.createQueueItem( { id: index }, null, null );
                queueItem.angle += 90;
                queueItem.angle += queueItem.angle >= 360 ? - 360 : 0;
                queueItem.uploaded = true;
                uploadQueue.push( queueItem );
            }

            rotateQueue.push( index, queueItem.angle, function( data ) {

            });
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
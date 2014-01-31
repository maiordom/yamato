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
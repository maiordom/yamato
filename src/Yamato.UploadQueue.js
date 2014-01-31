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
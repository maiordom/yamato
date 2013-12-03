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
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

        abort: function( iframe ) {
            if ( iframe ){
                try {
                    if ( iframe.stop ) { iframe.stop(); }
                    else if ( iframe.contentWindow.stop ) { iframe.contentWindow.stop(); }
                    else { iframe.contentWindow.document.execCommand( 'Stop' ); }
                }
                catch ( error ) {}
            }
        },

        createIframe: function( field, uid, url ) {
            var block = document.createElement( 'div' );
            block.innerHTML =
            '<form target="' + uid + '" action="' + url + '" method="POST" enctype="multipart/form-data" style="position: absolute; top: -1000px; overflow: hidden; width: 1px; height: 1px;">' +
                '<iframe name="' + uid + '" src="javascript:false;"></iframe>' +
                '<input value="' + uid + '" name="callback" type="hidden"/>' +
            '</form>';

            var form = block.getElementsByTagName( 'form' )[ 0 ],
                iframe = block.getElementsByTagName( 'iframe' )[ 0 ];

            var abort = function (){
                f.abort( iframe );
            };

            var send = function() {
                document.body.appendChild( block );
                form.appendChild( field );
                form.submit();
            };

            return {
                abort: abort,
                send: send
            }
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
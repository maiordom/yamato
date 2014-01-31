(function( $, root, undefined ) {

'use strict';

var Yamato = {};

@@Config
@@Flash
@@Iframe
@@UploadQueue
@@Multi
@@Canvas
@@Xhr
@@Manager

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
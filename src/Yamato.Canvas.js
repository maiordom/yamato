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
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

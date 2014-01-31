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

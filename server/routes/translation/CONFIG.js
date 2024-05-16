const appRoot = require('app-root-path');

const CONFIG = {
    GOOGLESHEET_ID: "1s4RNgWPstw6EzIrXKxOLVbdMpAiEVpuTUz7wzMAX9Xo",
    TRANSLATION_PATH: `${appRoot}/translationData`,
    TRANSLATION_JSON_PATH: `${appRoot}/translationData/translationData.json`,
    ALL_LANG_EXCEPT_EN: ['sc', 'tc', 'thai', 'kr', 'vi', 'id', 'jp', 'pt', 'es', 'hi', 'pt_br']
}

module.exports = { CONFIG }
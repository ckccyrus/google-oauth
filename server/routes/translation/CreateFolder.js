const fs = require("fs-extra");
const { CONFIG } = require('./CONFIG')

class CreateFolder {
    _reqObj = {};

    constructor($reqObj) {
        const _self = this;

        _self._reqObj = $reqObj;
    }



    createFolder() {
        const _self = this;

        removeFolder();
        fs.mkdirSync(CONFIG.TRANSLATION_PATH); // create directory


        function removeFolder() {
            fs.rmSync(CONFIG.TRANSLATION_PATH, { recursive: true, force: true });
        }
    }

    createJson() {
        const _self = this;

        fs.writeFileSync(`${CONFIG.TRANSLATION_PATH}/translationData.json`, JSON.stringify(_self._reqObj, null, 2), (err) => {
            if (err) {
                console.log("======Failed to write translation data to json======")
                console.log(err)
            } else {
                console.log("======Successfully write translation data to json======")
            }
        })

    }

    //-----------------------------------------
    init() {
        const _self = this;

        _self.createFolder();
        _self.createJson();
    }
}

module.exports = CreateFolder;
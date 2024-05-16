const express = require('express');
const router = express.Router();

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/utils/messenger`);

const FetchData = require("./FetchData")
const CreateFolder = require("./CreateFolder")
const { CONFIG } = require('./CONFIG');

let _isTranslationReady = true;

const update = async () => {
    const _fetchData = new FetchData();
    await _fetchData.init();
    const _data = _fetchData.getResult();

    const _createFolder = new CreateFolder(_data);
    _createFolder.init();
}

//Auto update in 1 hour
setInterval(async () => {
    if (_isTranslationReady) {
        _isTranslationReady = false;

        Messenger.openClose("Auto updating...")

        await update();

        _isTranslationReady = true;

        Messenger.openClose("/Auto updating...")
    } else {
        Messenger.log("Auto update fail, someone is updating now")
    }
    _isTranslationReady = true;
}, 1000 * 60 * 60)

//route handler
router.get('/', async (req, res) => {
    Messenger.openClose("Get Translation called")
    if (_isTranslationReady) {
        _isTranslationReady = false;

        await update();

        // res.setHeader('Content-Type', 'application/json');
        // res.sendFile(CONFIG.TRANSLATION_JSON_PATH);
        res.send("/translation");
        _isTranslationReady = true;
        // Messenger.openClose("/Update Translation")
    }
    Messenger.openClose("/Get Translation called")
})

router.get('/update', async (req, res) => {
    Messenger.openClose("Update Translation called")
    if (_isTranslationReady) {
        _isTranslationReady = false;

        await update();

        // res.setHeader('Content-Type', 'application/json');
        // res.sendFile(CONFIG.TRANSLATION_JSON_PATH);
        _isTranslationReady = true;
        // Messenger.openClose("/Update Translation")
    } else {
        let _response = {
            message: "Someone is updating now. Please F5 later.",
            errorCode: 801
        }
        res.send(_response);
    }
    _isTranslationReady = true;
})

module.exports = router;
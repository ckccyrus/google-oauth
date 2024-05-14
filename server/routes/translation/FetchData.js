const { GoogleSpreadsheet } = require('google-spreadsheet');

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/utils/messenger`);

const { CONFIG } = require('./CONFIG');

const OAuth = require('../oAuth/index')

class FetchData {
    constructor() { }

    async init() {
        const _self = this;

        await _self.loadInfo();
    }

    async loadInfo() {
        const _self = this;
        const oAuth2Client = OAuth.getInstance().oAuth2Client;
        const doc = new GoogleSpreadsheet(CONFIG.GOOGLESHEET_ID, oAuth2Client); // google spreadsheet ID

        await _self.retry(
            () => doc.loadInfo() // retry every 10s
        );

        for (let i = 0; i < doc.sheetsByIndex.length; i++) {
            const sheet = doc.sheetsByIndex[i];
            const sheetTitle = sheet.title;
            const sheetColor = sheet.tabColor

            Messenger.log("sheetTitle :>>", sheetTitle, "sheetColor :>>", sheetColor)
        }
    }

    retry(promise) {
        const _self = this;

        async function retryWithBackoff($retries) {
            try {
                if ($retries > 0) {
                    const _timeToWait = 10000;
                    console.log(`Reload in ${_timeToWait / 1000}s...`);
                    await new Promise((resolve) => setTimeout(resolve, _timeToWait));
                }
                return await promise();
            } catch (err) {
                if (err.response && err.response.status == 429) {
                    console.error(err.response.data.error.message)
                    return retryWithBackoff($retries + 1);
                } else {
                    console.log("Error==", err)
                }
            }
        }

        return retryWithBackoff(0);
    }
}

module.exports = FetchData;
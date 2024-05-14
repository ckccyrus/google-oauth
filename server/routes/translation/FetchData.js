const { GoogleSpreadsheet } = require('google-spreadsheet');

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/utils/messenger`);

const { CONFIG } = require('./CONFIG');

const OAuth = require('../oAuth/index')

class FetchData {
    _resultArray_All = []
    _resultArray_category = {}
    _categories = {
        gameTypes: [],
        components: [],
        cardGames: [],
        ams: [],
    }
    // category_gameTypes = []
    // category_components = []
    // category_cardGames = []
    // category_ams = []
    _allLangExceptEn = ["sc", "tc", "thai", "kr", "vi", "id", "jp", "pt", "es", "hi", "pt_br"]

    constructor() { }

    async init() {
        const _self = this;

        await _self.loadInfo();
    }

    async loadInfo() {
        const _self = this;
        const _oAuth2Client = OAuth.getInstance().oAuth2Client;
        const _doc = new GoogleSpreadsheet(CONFIG.GOOGLESHEET_ID, _oAuth2Client); // google spreadsheet ID

        await _self.retry(
            () => _doc.loadInfo() // retry every 10s
        );

        for (let i = 0; i < _doc.sheetsByIndex.length; i++) {
            const _sheet = _doc.sheetsByIndex[i];
            const _sheetTitle = _sheet.title;
            const _sheetColor = _sheet.tabColor

            Messenger.log("sheetTitle :>>", _sheetTitle, "sheetColor :>>", _sheetColor)

            const _rows = await _self.retry(     // read rows
                () => _sheet.getRows() // retry every 10s
            )

            await loadCell()    //load each cell data
            async function loadCell() {
                const _loadCell = _rows[_rows.length - 1].a1Range.split(":")[1]
                await _self.retry(
                    () => _sheet.loadCells(`A1:${_loadCell}`) // retry every 10s
                );
            }


            _self.getCategory(_sheetColor, _sheetTitle);

            // Messenger.log("rows :>>", rows);

            const _cells = _sheet._cells;
            const _sheetHeader = _self.getSheetHeader(_sheet) || [];
            const _sheetHeaderColor = _sheetHeader.map(header => header + "_Color");

            // const _resultArrayData = getResultArrayData(_rows,)

            // Messenger.log("_sheetHeader :>>", _sheetHeader)
            // Messenger.log("_sheetHeaderColor :>>", _sheetHeaderColor)

            // Messenger.log("_sheet", _sheet)
            Messenger.log("_cells", _cells)
        }

        Messenger.log("_categories :>>", _self._categories)
    }

    getCategory($color, $title) {
        const _self = this;
        const _onlyOneColor = Object.keys($color).length === 1;

        if ($color.red === 1 && _onlyOneColor) {
            _self._categories.gameTypes.push($title);
        }
        if ($color.blue === 1 && _onlyOneColor) {
            _self._categories.components.push($title);
        }
        if ($color.green === 1 && _onlyOneColor) {
            _self._categories.cardGames.push($title);
        }
        if ($color.red === 1 && $color.green == 0.6) {
            _self._categories.ams.push($title);
        }
    }

    getSheetHeader($sheet) {
        const _header = $sheet.headerValues.filter((element) => {    //['category', 'en', 'sc', 'langKey']
            return element != ''; // filter out blank columns
        })
        return _header;
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
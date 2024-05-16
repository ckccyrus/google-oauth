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

            const _rows = await _self.retry(     // read rows
                () => _sheet.getRows() // retry every 10s
            )

            await loadCell()    //load each cell data
            async function loadCell() {
                const _lastCellInEachRow = _rows[_rows.length - 1].a1Range;     //format:'SystemMessage'!A189:P189
                const _lastCellIndex = _lastCellInEachRow.split(":")[1];   //P189
                await _self.retry(
                    () => _sheet.loadCells(`A1:${_lastCellIndex}`) //get every cell from A1 to last cell index
                );
            }

            _self.getCategory(_sheetColor, _sheetTitle);

            const _cells = _sheet._cells;
            const _sheetHeader = _self.getSheetHeader(_sheet) || [];
            const _eachSheetResult = _self.getSheetResult(_rows, _sheetHeader, _sheetTitle) || [];

            _self._resultArray_category[_sheetTitle] = [..._eachSheetResult];
            _self._resultArray_All = _self._resultArray_All.concat(_eachSheetResult);
        }
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

    getAllCellsWithCategory($cells, $sheetHeader) {
        const _self = this;
        const _allCellsWithCategory = [];
        $cells.forEach((element) => {
            const _index = $sheetHeader.indexOf("category")
            if (element[_index]._rawData.formattedValue) { //filter out category == ''
                _allCellsWithCategory.push(element)
            }
        });
        return _allCellsWithCategory;
    }

    getSheetResult($rows, $sheetHeader, $sheetTitle) {
        let _sheetResult = [];

        for (let row of $rows) {
            let _eachLangObj = {}
            for (let header of $sheetHeader) {
                _eachLangObj[header] = row.get(header);
            }
            _sheetResult.push(_eachLangObj) // array contains data property
        }

        filterNoCategoryResult();
        fillEmptyValue();
        appendTitle();

        function filterNoCategoryResult() {
            _sheetResult = _sheetResult.filter((element) => { // filter out undefined category
                return (element['category'] !== undefined && element['category'] !== "")
            })
        }

        function fillEmptyValue() {
            _sheetResult.forEach(($eachResult) => {
                CONFIG.ALL_LANG_EXCEPT_EN.forEach(($lang) => {
                    if ($eachResult[$lang] === "") $eachResult[$lang] = $eachResult["en"];   //use en when other lang is empty
                })
            })
        }

        function appendTitle() {
            _sheetResult.forEach((element) => {
                element.saved = false // display saved
                element.title = $sheetTitle // category title
            })
        }

        return _sheetResult;
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

    getResult(){
        const _self = this;
        const _sendObj = {};
        
        _sendObj["resultArray_All"] = _self._resultArray_All;
        _sendObj["resultArray_category"] = _self._resultArray_category;
        _sendObj["categories"] = _self._categories;
        _sendObj['lastUpdate'] = _self.getUpdateTime();

        return _sendObj;
    }

    getUpdateTime() {
        const date = new Date(),
            currentDate = new Date().toISOString().split('T')[0],
            currentHour = ("0" + date.getHours()).slice(-2),
            currentMinute = ("0" + date.getMinutes()).slice(-2),
            currentSecond = ("0" + date.getSeconds()).slice(-2)

        const updateDate = `${currentDate} ${currentHour}:${currentMinute}:${currentSecond}`;

        return updateDate;
    }
}

module.exports = FetchData;
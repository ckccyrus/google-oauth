// const { GoogleSpreadsheet } = require('google-spreadsheet'),
//     { CONFIG } = require('./config')
// const translationCreds = require("../../credentials/translation_credentials.json");

// let oAuth2Client;
// getOauthClient();
// async function getOauthClient(){
//     const oAuth2 = await require("../oauth/index");
//     oAuth2Client = oAuth2.oAuth2Client;
// }

class FetchData {
    constructor() {}

    resultArray_All = []
    resultArray_category = {}
    category_gameTypes = []
    category_components = []
    category_cardGames = []
    category_ams = []
    allLangExceptEn = ["sc", "tc", "thai", "kr", "vi", "id", "jp", "pt", "es", "hi", "pt_br"]

    resetTranslationData() {
        const _self = this;

        _self.resultArray_All = []
        _self.resultArray_category = {}
        _self.category_gameTypes = []
        _self.category_components = []
        _self.category_cardGames = []
        _self.category_ams = []
    }

    async loadInfo() {
        const _self = this;

        const doc = new GoogleSpreadsheet(CONFIG.GOOGLESHEET_ID); // google spreadsheet ID
        // await doc.useServiceAccountAuth({
        //     client_email: translationCreds.client_email,
        //     private_key: translationCreds.private_key,
        // });
        doc.useOAuth2Client(oAuth2Client);

        await _self.retry(
            () => doc.loadInfo() // retry every 10s
        );

        for (let i = 0; i < doc.sheetsByIndex.length; i++) {
            const sheet = doc.sheetsByIndex[i];
            const sheetTitle = sheet.title;
            const sheetColor = sheet.tabColor

            getCategory(sheetColor, sheetTitle)
            console.log("sheetTitle", sheetTitle, sheet.tabColor)

            let rows = await _self.retry(
                () => sheet.getRows() // retry every 10s
            );
// console.log("rows", rows)  // KEEP
            await loadCell()
            async function loadCell() {
                let _loadCell = rows[rows.length - 1].a1Range.split(":")
                _loadCell = _loadCell[1]
                await _self.retry(
                    () => sheet.loadCells(`A1:${_loadCell}`) // retry every 10s
                );
            }

            let cells = sheet._cells,
                colorArray_All = [],
                sheetHeader = [],
                sheetHeaderColor = [],
                sheetResult = [],
                colorResult = []

            getSheetHeader()
            getSheetHeaderColor()
            getBackgroundColor()
            getResultArrayData()
            getResultArrayColor()
            combineResultArray()

            _self.resultArray_category[sheetTitle] = JSON.parse(JSON.stringify(sheetResult))
            _self.resultArray_All = _self.resultArray_All.concat(sheetResult)
// console.log("sheetResult", sheetResult) // KEEP
// console.log("sheetHeader", sheetHeader, "\nsheetHeaderColor", sheetHeaderColor) // KEEP

            function getSheetHeader() {
                sheetHeader = sheet.headerValues //['category', 'en', 'sc']
                sheetHeader = sheetHeader.filter((element) => {
                    if (element != '') {// filter out blank columns
                        return true
                    }
                    return false
                })
            }
            function getSheetHeaderColor() {
                for (let property in sheetHeader) {
                    sheetHeaderColor.push(`${sheetHeader[property]}_Color`) //['category_Color', 'en_Color', 'sc_Color']
                }
            }
            function getBackgroundColor() {
                let _removeColorIndexArray = []
                cells.forEach((element) => {
                    const _index = sheetHeader.indexOf("category")
                    if (element[_index]._rawData.formattedValue) { //filter out category == ''
                        colorArray_All.push(element)
                    }
                });

                colorArray_All[0].forEach((element, index) => {
                    if (!element._rawData.formattedValue) {
                        _removeColorIndexArray.push(index) // blank header index
                    }
                })
                _removeColorIndexArray.sort((a, b) => b - a)

                colorArray_All.forEach((row) => { //filter out blank header columns
                    for (var i = 0; i < _removeColorIndexArray.length; i++) {
                        row.splice(_removeColorIndexArray[i], 1)
                    }

                    row.forEach((element, index, object) => { //get cell background color
                        object[index] = (element._rawData.effectiveFormat == undefined) ? {} : changeColorFormat(element._rawData.effectiveFormat.backgroundColor)
                    })
                })
                function changeColorFormat($object) {
                    if ($object.red == undefined) {
                        $object.red = 0
                    }
                    if ($object.green == undefined) {
                        $object.green = 0
                    }
                    if ($object.blue == undefined) {
                        $object.blue = 0
                    }
                    if ($object.red == 1 && $object.green == 1 && $object.blue == 1) {
                        return ''
                    }
                    return `rgb(${$object.red * 255}, ${$object.green * 255}, ${$object.blue * 255})`
                }

                colorArray_All.splice(0, 1) // filter out first row i.e. category
// console.log("colorArray_All", colorArray_All) // KEEP
            }
            function getCategory($sheetColor, $sheetTitle) {
                if ($sheetColor.red == 1 && Object.keys($sheetColor).length == 1) {
                    _self.category_gameTypes.push($sheetTitle)
                }
                if ($sheetColor.blue == 1 && Object.keys($sheetColor).length == 1) {
                    _self.category_components.push($sheetTitle)
                }
                if ($sheetColor.green == 1 && Object.keys($sheetColor).length == 1) {
                    _self.category_cardGames.push($sheetTitle)
                }
                if ($sheetColor.red == 1 && $sheetColor.green == 0.6) {
                    _self.category_ams.push($sheetTitle)
                }
            }
            function getResultArrayData() {
                for (let row of rows) {
                    let _obj = {}
                    for (let header of sheetHeader) {
                        _obj[header] = row[header]
                    }
                    sheetResult.push(_obj) // array contains data property
                }

                sheetResult = sheetResult.filter((element) => { // filter out undefined category
                    if (element['category'] != undefined && element['category'] != "") {
                        return true
                    }
                    return false
                })

                // show en value when empty value
                sheetResult.forEach((rowData) => {
                    _self.allLangExceptEn.forEach((lang) => {
                        if (rowData[lang] == "") {
                            rowData[lang] = rowData["en"]
                        }
                    })
                })
            }
            function getResultArrayColor() {
                for (let row of colorArray_All) {
                    let _obj = {}
                    for (let [index, colorHeader] of sheetHeaderColor.entries()) {
                        _obj[colorHeader] = row[index]
                    }
                    colorResult.push(_obj) //array contains color property
                }
            }
            function combineResultArray() {
                sheetResult.forEach((ele, index, object) => { // combine resultData and resultColorinto 1 array
                    object[index] = { ...ele, ...colorResult[index] }
                })

                sheetResult.forEach((element) => {
                    element.saved = false // display saved
                    element.title = sheetTitle // category title
                })
            }
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
            if(err.response && err.response.status == 429){
              console.error(err.response.data.error.message)
              return retryWithBackoff($retries + 1);
            } else {
              console.log("Error==", err)
            }
          }
        }
      
        return retryWithBackoff(0);
    }

    createSendObj() {
        const _self = this;

        let _sendObj = {},
            resultArray_category = _self.resultArray_category;
        
        _sendObj["resultArray_All"] = _self.resultArray_All;
        _sendObj["category_gameTypes"] = _self.category_gameTypes;
        _sendObj["category_components"] = _self.category_components;
        _sendObj["category_cardGames"] = _self.category_cardGames;
        _sendObj["category_ams"] = _self.category_ams;
        _sendObj = {..._sendObj, resultArray_category}
        _sendObj['lastUpdate'] = _self.getUpdateTime();

        return _sendObj;
    }

    getUpdateTime() {
        let date = new Date(),
            currentDate = new Date().toISOString().split('T')[0],
            currentHour = ("0" + date.getHours()).slice(-2),
            currentMinute = ("0" + date.getMinutes()).slice(-2),
            currentSecond = ("0" + date.getSeconds()).slice(-2)

        let updateDate = `${currentDate} ${currentHour}:${currentMinute}:${currentSecond}`;

        return updateDate;
    }

    //-----------------------------------------
    async init() {
        const _self = this;

        _self.resetTranslationData();
        await _self.loadInfo();
        return _self.createSendObj();
    }
}

module.exports = FetchData;
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const OAuth = require('./routes/oAuth')

async function main() {
    const _oAuth = OAuth.getInstance();
    await _oAuth.init();

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/translation', routes.translation)

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log('Connected to port ' + port)
    })
}

main();
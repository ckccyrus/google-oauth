const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('Hello World');
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Connected to port ' + port)
})
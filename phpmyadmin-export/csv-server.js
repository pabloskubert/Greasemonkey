/* 
    This script is used within grasemonkey script "phpmyadmin-export"
    This little script receives the json data and convert to csv format
*/

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const app = express();

const SAVE_TO = path.join(os.homedir(), 'OUTPUT_CSV');
if (!fs.existsSync(SAVE_TO)) fs.mkdirSync(SAVE_TO);

console.info('Saving all csv files to '+SAVE_TO);

app.use(express.json());
app.post('/', (req, res) => {
    const d = req.body;
    console.info(`Got csv data from ${d.host} saving to file ${d.fname}`);
    const rows = JSON.parse(d.data);

    rows.forEach((row) => {
        let row_csv = "";
        for (let i = 0; i < row.length; i++) {
            row_csv = row_csv.concat(`\"${row[i]}\"${((i+1) < row.length)?",":""}`);
        }

        fs.appendFile(path.join(SAVE_TO, d.fname), row_csv.concat('\n'), (err) => {
            if (err) {
                console.info(`Error saving ${d.name} file err: ${err.message}`);
            }
        });
    });
    res.sendStatus(200);
});

app.listen({
    host: "127.0.0.1",
    port: 27381
}, () => {
    console.info('Waiting for csv data on http://127.0.0.1:27381')
});
// ==UserScript==
// @name         phpmyadmin-export
// @namespace    https://phpmyadmin.net/
// @version      2.0
// @description Replace export function of phpmyadmin in very old versions, goto phpmyadmin/sql.php to start this script
// @author       Pablo Skubert
// @include      https://*/phpmyadmin*/sql.php*
// @include      http://*/phpmyadmin*/sql.php*
// @run-at document-end
// @grant GM_xmlhttpRequest
// ==/UserScript==
/*
    This script is only useful when you're working with old phpmyadmin versions
    like 2.6.1 or 2.11.1 where the export function give these errors:

        Missing: parameter what
        Missing: parameter db

    And another errors like these.
*/

(function () {
    'use strict';

    const
        CSV_SERVER = "http://127.0.0.1:27381",
        FIRST_RUN = localStorage.getItem('FE') === null,
        OUTPUT_FILENAME = localStorage.getItem('OTP_FNAME'),
        MAX_PER_REQ = 30;

    let
        sql_query = localStorage.getItem('USER_SQL'),
        target_db = localStorage.getItem('DB_NAME'),
        total_rows = localStorage.getItem('TOTAL_ROWS'),
        OFFSET = parseInt(localStorage.getItem('CURRENT_OFFSET')) | 0,
        error = false;

    if (FIRST_RUN) {
        let isInputCorrect = false, output_filename = '';
        do {
            sql_query = prompt('Enter sql query, without \"LIMIT\" keyword.');
            target_db = prompt('Enter target database name');
            OFFSET = parseInt(prompt('Start by (default 0)', '0'));
            output_filename = prompt('Enter output filename, this script will create a CSV file format with extracted data.');
            total_rows = prompt('Enter total count of rows in target table. If u dont know, just do \"select count(*) from \'table_name\'\"');
            var answer = prompt(`
                Resume of configurations:\n

                    \tSql: ${sql_query}\n
                    \tDb_name: ${target_db}\n
                    \tTotal rows: ${total_rows}\n
                    \tFilename: ${output_filename}\n

                \nAre these informations correct ? (Y/n)
            `, 'Y');

            isInputCorrect = answer.includes('Y');
        } while (!isInputCorrect);

        localStorage.setItem('USER_SQL', sql_query);
        localStorage.setItem('DB_NAME', target_db);
        localStorage.setItem('TOTAL_ROWS', total_rows);
        localStorage.setItem('OTP_FNAME', output_filename);
        localStorage.setItem('FE', false);
        localStorage.setItem('CURRENT_OFFSET', 0);

    } else {
        /* collect retrieved data in html and post to csv server */
        const table_data = document.querySelector('#table_results');
        let csv_list = [];
        const table_rows = table_data.tBodies[0].children;
        let index = 0, tr_i = 1;
        for (let tr of table_rows) {
            // jump table head
            if (index <= 1) {
                index += 1;
                continue;
            }

            let row_csv = [];
            let table_data = tr.children;
            for (let td of table_data) {
                row_csv.push(td.textContent);
            };
            csv_list.push(row_csv);
            tr_i = 1;
        }
        /* post collected content to CSV SERVER */
        const err = () => {
            alert('You need to start the CSV SERVER, in commandline put: node /path/to/server/csv_server.js, or kill the process that is using the port \"27381\"');
            localStorage.clear();
            error = true;
        }

        GM_xmlhttpRequest({
            synchronous: true,
            method: 'POST',
            url: CSV_SERVER.concat('/'),
            data: JSON.stringify({ data: JSON.stringify(csv_list), fname: OUTPUT_FILENAME, host: location.host }),
            headers: {
                "Content-Type": "application/json"
            },
            onerror: err,
            ontimeout: err,
        });
    }

    if (error) return;
    if (OFFSET === -1) {
        alert('End, check in the console where csv server saved it.');
        return;
    }
    /* setup offset and limit string */
    let limit_str, new_offset = OFFSET;
    const offset_sum = (OFFSET + MAX_PER_REQ);
    const exceeded = offset_sum > total_rows;
    const exceedent = (offset_sum - OFFSET);

    if (exceeded) {
        const startBy = (OFFSET - exceedent);
        limit_str = ` LIMIT ${startBy},${exceedent}`;
        new_offset = -1;
    } else {
        new_offset += (!FIRST_RUN) ? MAX_PER_REQ : 0;
        limit_str = ` LIMIT ${new_offset},${MAX_PER_REQ}`;
    }

    /* setup query and update offset */
    localStorage.setItem('CURRENT_OFFSET', new_offset);
    location.search = `db=${target_db}&sql_query=${sql_query.concat(limit_str).replaceAll(' ', '+')}`;
})();
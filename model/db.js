const mysql = require('mysql');

const pool = mysql.createPool({
   connectionLimit :10,
   host            :'localhost',
   user            : 'root',
   password        : '',
   database        :'tasker'
});

// const connection = mysql.createConnection({
//    host            : 'localhost',
//    user            : 'root',
//    password        : '',
//    database        : 'tasker'
// });

// connection.connect(function(err){
//    if(err){
//       console.error(err)
//    } else{
//       console.log('connection ok');
//    }
// })


// module.exports = connection;
module.exports = pool;
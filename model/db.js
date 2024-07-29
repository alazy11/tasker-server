const mysql = require('mysql');

const pool = mysql.createPool({
   connectionLimit :10,
   host            :process.env.DB_HOST,
   user            : process.env.DB_USER,
   password        : process.env.DB_PASSWORD,
   database        : process.env.DB_NAME
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
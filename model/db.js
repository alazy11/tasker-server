const mysql = require('mysql');

const pool = mysql.createPool({
   host            :process.env.DB_HOST,
   user            : process.env.DB_USER,
   password        : process.env.DB_PASSWORD,
   database        : process.env.DB_NAME,
   waitForConnections: true,
   connectionLimit: 10, // Set an appropriate connection limit
   queueLimit: 0
});


// connection.connect(function(err){
//    if(err){
//       console.error(err)
//    } else{
//       console.log('connection ok');
//    }
// })


// module.exports = connection;
module.exports = pool;
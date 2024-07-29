const pool = require("../model/db");

const isTheCreator = (id)=>{

   // is_active
    return new Promise((resolve,reject)=>{
    pool.query(
        `SELECT * FROM meeting WHERE creator = ?`,[id],
        (error, result, fields) => {
           if (error) {
              console.log("sql error", error);
              reject(error)
              return;
           }
           if(result.length > 0) {
            if(result[0].is_active){
               resolve(true)
            } else {
               resolve(false) 
            }
           } else {
            resolve(false)  
           }
        }
     )

    })
}

module.exports = isTheCreator;
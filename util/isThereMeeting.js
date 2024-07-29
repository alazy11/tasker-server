const pool = require("../model/db");

const isThereMeeting = (id)=>{

    return new Promise((resolve,reject)=>{
    pool.query(
        `SELECT * FROM meeting WHERE creator = ?`,[id],
        (error, result, fields) => {
           if (error) {
              console.log("sql error", error);
              reject(error)
            //   next(AppError.create(error, 500, "database Error"));
              return;
           }
           if(result.length > 0) {
            resolve(true)
           } else {
            resolve(false)  
           }
        }
     )

    })
}

// isThereMeeting
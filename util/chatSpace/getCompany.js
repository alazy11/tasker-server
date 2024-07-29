const pool = require('../../model/db');

const getCompany = async (id)=> {

   return new Promise((resolve,reject)=>{

      pool.query(
         `SELECT public_name, profile_path FROM company WHERE company_id = ? `,
         [id],
         (error, result, fields) => {
            if (error) {
               console.log("sql error", error);
               reject(error);
               // next(AppError.create(error, 500, "database Error"));
               return;
            }
            resolve(result[0])
         }
      );

   })

}


module.exports = getCompany;
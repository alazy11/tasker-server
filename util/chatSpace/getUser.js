const pool = require('../../model/db');

const getUser = async (id)=> {
      return new Promise((resolve,reject)=>{
         pool.query(
            `SELECT public_name, profile_path FROM user WHERE user_id = ? `,
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

module.exports = getUser;
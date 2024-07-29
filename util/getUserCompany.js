const pool = require("../model/db");

const getUserCompany = async (id)=> {

   return new Promise((resolve,reject)=>{

      pool.query(
         `SELECT company_id FROM employee WHERE user_id = ? `,
         [id],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               reject(error)
            }
            resolve(result[0].company_id)
         }
      );

   })

}

module.exports = getUserCompany;
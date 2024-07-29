const pool = require("../model/db");

const gatEmployee = (id)=>{

    return new Promise((resolve,reject)=>{

        pool.query(
           `SELECT employee_id FROM employee WHERE user_id = ? `,
           [id],
           (error, result, fields) => {
              if (error) {
                 console.log(error);
                 reject(error)
              }
              resolve(result[0].employee_id)
           }
        );
  
     })

}


module.exports = gatEmployee;
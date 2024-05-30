const RESPONSE = require("../../handlers/errorHandler");
const pool = require("../../model/db");
const AppError = require("../../util/customError");


const isAlreadyEmployee = (req, res, next)=>{

   let {user_id} = req.body;

   pool.query(
      "SELECT user_id FROM employee WHERE user_id = ?",
      [user_id],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if(result.length === 0) {
            next();
         } else {
            RESPONSE.failHandler(res, 200, {
               message:'this user has already an employee !'
            });
         }
      }
   );

}

module.exports = isAlreadyEmployee;
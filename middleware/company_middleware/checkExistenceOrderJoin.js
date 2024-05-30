const RESPONSE = require("../../handlers/errorHandler");
const pool = require("../../model/db");
const AppError = require("../../util/customError");

const checkExistenceOrderJoin = (req, res, next)=>{

   console.log('user alazy',req.user);

   let {
      user_id
   } = req.body;

   const order = [user_id, req.user.id];

   pool.query(
      "SELECT user_id FROM join_orders WHERE user_id = ? AND company_id = ?",
      order,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if(result.length == 0) {
            next();
         } else {
            RESPONSE.failHandler(res, 200, {
               message: 'you have already send request to this user.'
            });
         }
      }
   );

}


module.exports = checkExistenceOrderJoin;
const RESPONSE = require("../../handlers/errorHandler");
const pool = require("../../model/db");
const AppError = require("../../util/customError");

const isAlreadyInSpace = (req, res, next)=> {

   let {
      memberID,
      spaceID
   } = req.body;

   // memberID.shift();

   let member = [];
   memberID.forEach(element => {
      member.push([spaceID,element.employee_id]);
   });

   pool.query('SELECT * FROM space_members WHERE space_id = ? AND employee_id = ?',[spaceID,memberID[0].employee_id],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
      }
      console.log("result...", result);
      if(result.length > 0) {
         RESPONSE.failHandler(res, 200, {
            message : "this employee has been already in this space."
         });
      } else {
         next();
      }
   }
);

}


module.exports = isAlreadyInSpace;
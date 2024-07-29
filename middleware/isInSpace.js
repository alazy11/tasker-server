const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');



const isUserInSpace = (req, res, next)=>{

    const spaceID = req.params.spaceID;

    pool.query(
        `SELECT * FROM space_members WHERE employee_id IN(SELECT employee_id FROM employee WHERE user_id = ?) AND space_id = ?`,
        [req.user.id,spaceID],
        (error, result, fields) => {
           if (error) {
              console.log("sql error", error);
              next(AppError.create(error, 500, "database Error"));
           }
           // console.log('space result....', result);

           if(result.length > 0) {
            next()
           } else {
            RESPONSE.failHandler(res,404,{
                message:'you are not in this space'
            })
           }
  
        }
     );

}

const isCompanyInSpace = (req, res, next)=>{

    pool.query(
        `SELECT * FROM space WHERE company_id = ?`,
        [req.user.id],
        (error, result, fields) => {
           if (error) {
              console.log("sql error", error);
              next(AppError.create(error, 500, "database Error"));
           }

           if(result.length > 0) {
            next()
           } else {
            RESPONSE.failHandler(res,404,{
                message:'you are not in this space'
            })
           }
  
        }
     );

}


module.exports = {
    isUserInSpace,
    isCompanyInSpace
}
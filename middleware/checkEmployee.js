

const checkEmployee = (req,res,next)=>{

   let {userId} = req.body;
   
   pool.query(
      "SELECT employee_id FROM employee WHERE user_id = ? ",
      [userId],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log(result);
         if (result.length > 0) {

            RESPONSE.failHandler(res, 500, {
               email: "this user already Employment!",
            });
            
         } else {
            next();
         }
      }
   );
}


module.exports = checkEmployee;
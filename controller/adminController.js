const RESPONSE = require("../handlers/errorHandler");
const pool = require("../model/db");
const createToken = require("../util/creatToken");
const { hash, compare } = require("bcrypt");
const AppError = require("../util/customError");
const { validationResult } = require("express-validator");



const login = (req, res, next) => {
   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let { userName, password } = req.body;
   pool.query(
      "SELECT admin_name,admin_password,user_id FROM admin WHERE admin_name = ?",
      userName,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if (result.length > 0) {
            console.log(result)
            compare(password, result[0]["admin_password"], (err, resul) => {
               console.log('result com...',result)
               if (err){
                  console.log('compar...',err);
                  next(AppError.create(error, 500, "database Error"));
               } 
               if (resul) {
                  console.log(resul);
                  const token = createToken({
                     id: result[0]["user_id"],
                     userName: result[0]["admin_name"],
                  });
                  res.cookie("token", token, {
                     secure: true,
                     httpOnly: true,
                     sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                     domain: process.env.DOMAIN,
                     path: "/en/admin",
                     maxAge: 1200000,
                  });

                  RESPONSE.successHandler(res, 200, {
                     id: result[0]["user_id"],
                     userName: result[0]["admin_name"],
                  });
                  return;
               }
               RESPONSE.errorHandler(res, 401, 
                  'the password is not correct'
               );
            });
         } else {
               RESPONSE.errorHandler(res, 500, 
               'the user name is not exists'
               );
         }

      }
   );
};

module.exports = {login};
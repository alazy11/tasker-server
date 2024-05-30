const RESPONSE = require("../handlers/errorHandler");
const pool = require("../model/db");
const createToken = require("../util/creatToken");
const { hash, compare } = require("bcrypt");
const AppError = require("../util/customError");
const { validationResult } = require("express-validator");
const {addEmployee} = require('./companyController');
require('dotenv').config();

const create = (req, res, next) => {
   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let {
      userName,
      name,
      phone,
      email,
      password,
      job,
      gender,
      birthDate,
      country,
   } = req.body;
   const roomId = userName + require('crypto').randomBytes(5).toString('hex');
   hash(password, 10, (err, hash) => {
      if (err) RESPONSE.errorHandler(res, 500, "something wrong!");
      const user = [
         userName,
         name,
         phone,
         email,
         job,
         hash,
         birthDate,
         gender,
         country,
         roomId
      ];
      pool.query(
         "INSERT INTO user SET user_name = ?,public_name = ?,phone_number = ?,email = ?,job = ?,user_password = ?,birth_date = ?,gender = ?,country = ?,room_ID = ?",
         user,
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log("result...", result);
            const token = createToken({
               id: result.insertId,
               userName: userName,
               email: email,
            });
            res.cookie("token", token, {
               secure: true,
               httpOnly: true,
               sameSite: "lax",
               domain: process.env.DOMAIN,
               path: "/en/user",
               maxAge: 1200000,
            });
            RESPONSE.successHandler(res, 200, {
               user: userName,
               token: res.getHeader("Set-Cookie"),
            });
         }
      );
   });
};

const searchByUserNameAndEmail = (req, res, next) => {
   let userName, email;
   console.log(req.query.userName);
   if (req.query.userName) {
      ({ userName } = req.query);

      pool.query(
         "SELECT user_name FROM user WHERE user_name = ? ",
         [userName],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log(result);
            if (result.length !== 0) {
               RESPONSE.failHandler(res, 500, {
                  userName: "this User name has already exist!",
               });
            } else {
               RESPONSE.successHandler(res, 200, {
                  userName: "this User name correct",
               });
            }
         }
      );
   } else {
      ({ email } = req.query);

      pool.query(
         "SELECT email FROM user WHERE email = ? ",
         [email],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log(result);
            if (result.length !== 0) {
               RESPONSE.failHandler(res, 500, {
                  email: "this email has already exist!",
               });
            } else {
               RESPONSE.successHandler(res, 200, {
                  email: "this email correct",
               });
            }
         }
      );
   }
};

const login = (req, res, next) => {
   // const result = validationResult(req);
   // if (!result.isEmpty()) {
   //    return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   // }
   let { userName, password } = req.body;

   pool.query(
      "SELECT user_id,user_name,user_password,room_ID FROM user WHERE user_name = ?",
      userName,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if (result.length > 0) {
            console.log(result)
            compare(password, result[0]["user_password"], (err, resul) => {
               console.log('result com...',result)
               if (err){
                  console.log('compar...',err);
                  next(AppError.create(error, 500, "database Error"));
               } 
               if (resul) {
                  console.log(resul);
                  const token = createToken({
                     id: result[0]["user_id"],
                     userName: result[0]["user_name"],
                  });
                  res.cookie("token", token, {
                     secure: true,
                     httpOnly: true,
                     sameSite: "lax",
                     domain: process.env.DOMAIN,
                     path: "/en/user",
                     maxAge: 3600000,
                  });

                  res.cookie("roomId", result[0]["room_ID"], {
                     // secure: true,
                     // httpOnly: true,
                     sameSite: "lax",
                     domain: process.env.DOMAIN,
                     path: "/en/user",
                     maxAge: 3600000,
                  });

                  RESPONSE.successHandler(res, 200, {
                     id: result[0]["user_id"],
                     userName: result[0]["user_name"],
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


const getUser = (req, res, next)=>{
   console.log('user',req.user);
   pool.query(
      "SELECT * FROM user WHERE user_name = ? ",
      [req.user.userName],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if (result.length > 0) {
            RESPONSE.successHandler(res, 200, {
               ...result[0]
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );

}


const searchUser = (req, res, next)=>{
   // console.log('user',req.user);
   let user = req.query.user;
   pool.query(
      "SELECT * FROM user WHERE user_name = ? ",
      [user],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if (result.length > 0) {
            RESPONSE.successHandler(res, 200, {
               ...result[0]
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );

}

const gatAllOrderJoin = (req, res, next)=>{
   console.log('user alazy',req.user);

   pool.query(
      // "SELECT * FROM join_orders WHERE user_id = ?",
      "SELECT join_orders.company_id,join_orders.company_name,join_orders.job,join_orders.user_id,company.room_ID,company.profile_path FROM join_orders INNER JOIN company USING(company_id) WHERE join_orders.user_id = ?",
      [req.user.id],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         RESPONSE.successHandler(res, 200, {
            ...result
         });
      }
   );

}

const acceptOrder = (req, res, next)=>{
   addEmployee(req,res,next);
}

const deleteOrder = (req, res, next)=>{

   let company = req.query.company_id;

   console.log("company",company)
   // company_id = parseInt(company_id);
   
   pool.query(
      "DELETE FROM join_orders WHERE user_id = ? AND company_id = ?",
      [req.user.id,company],
      (error, result, fields) => {
         if (error) {
            console.log("delete join error >>>",error);
            next(AppError.create(error, 500, "database Error"));
         }

         RESPONSE.successHandler(res, 200, {
            message: "Order has been deleted."
         });
      }
   );

}

module.exports = {
   create,
   searchByUserNameAndEmail,
   login,
   getUser,
   gatAllOrderJoin,
   searchUser,
   acceptOrder,
   deleteOrder
};

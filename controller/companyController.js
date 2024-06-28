const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const createToken = require('../util/creatToken')
const { hash, compare } = require("bcrypt");
const AppError = require('../util/customError');
const {validationResult} = require('express-validator');
const generatSecretKey = require('../util/generatSecretKey');
const transporter = require('../util/emailService');
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
         country,
         secretKey,
      } = req.body;
      const roomId = userName + require('crypto').randomBytes(5).toString('hex');
      hash(password, 10, (err, hash) => {
         if (err){
            RESPONSE.errorHandler(res, 500, "something wrong!");
            return;
         } 
         const user = [
            userName,
            name,
            phone,
            email,
            job,
            hash,
            country,
            secretKey,
            roomId
         ];

         pool.query('INSERT INTO company SET company_name = ?,public_name = ?,phone_number = ?,email = ?,job = ?,company_password = ?,country = ?,security_key = ?, room_ID = ?',user,(error,result,fields)=>{
               if (error) {
                  console.log(error);
                  next(AppError.create(error, 500, "database Error"));
               }
               // console.log("result...", result);
               const token = createToken({
                  id: result.insertId,
                  userName: userName,
                  email: email,
               });
               res.cookie("token", token, {
                  secure: true,
                  httpOnly: true,
                  sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                  domain: process.env.DOMAIN,
                  path: "/en/company",
                  maxAge: 3600000,
               });
               RESPONSE.successHandler(res, 200, {
                  user: userName,
                  token: res.getHeader("Set-Cookie"),
               });
            }
         );
      });
   };




const searchByUserNameAndEmail = (req,res,next) =>{

   let userName,email;
   console.log(req.query.userName)
   if(req.query.userName){
      ({userName} = req.query);

      pool.query('SELECT company_name FROM company WHERE company_name = ? ',[userName],(error,result,fields)=>{
         if(error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if(result.length !== 0){
            RESPONSE.failHandler(res,500,{
               userName:'this User name has already exist!'
            });
         } else {

            pool.query('SELECT user_name FROM user WHERE user_name = ? ',[userName],(error,result,fields)=>{
               if(error) {
                  console.log('mysql error',error);
                  next(AppError.create(error, 500, "database Error"));
               }
               console.log(result);
               if(result.length !== 0){
                  RESPONSE.failHandler(res,500,{
                     userName:'this User name has already exist!'
                  });
               } else {
                  RESPONSE.successHandler(res,200,{
                     userName:'this User name correct'
                  });
               }
            })

            // RESPONSE.successHandler(res,200,{
            //    userName:'this User name correct'
            // });
         }
      })

   } else{
      ({email} = req.query);

      pool.query('SELECT email FROM company WHERE email = ? ',[email],(error,result,fields)=>{
         if(error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if(result.length !== 0){
            RESPONSE.failHandler(res,500,{
               email:'this email has already exist!'
            });
         } else {
            pool.query('SELECT email FROM user WHERE email = ? ',[email],(error,result,fields)=>{
               if(error) {
                  console.log(error);
                  next(AppError.create(error, 500, "database Error"));
               }
               console.log(result);
               if(result.length !== 0){
                  RESPONSE.failHandler(res,500,{
                     email:'this email has already exist!'
                  });
               } else {
                  RESPONSE.successHandler(res,200,{
                     email:'this email correct'
                  });
               }
            })
            // RESPONSE.successHandler(res,200,{
            //    email:'this email correct'
            // });
         }
      })


   }
}

const getSecretKey = (req, res, next)=>{
   const {companyName} = req.query;
   const {companyEmail} = req.query;
   console.log("companyName",companyName);
   //  let secretKey = 45646;
   let secretKey = generatSecretKey(companyName);
   // console.log("secretKey.....",secretKey)
   pool.query('INSERT INTO Secrect_key SET company_name = ?, company_secret_key = ?',[companyName,secretKey],(err,result, fields)=>{
      if(err) next(AppError.create(err, 500, "database Error"));;

      RESPONSE.successHandler(res,200,{
         secretKey: secretKey
      });
   })
   
}


const login = (req, res, next) => {

   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let { userName, password, secretKey } = req.body;

   pool.query(
      "SELECT company_id,company_name,company_password,security_key,room_ID FROM company WHERE company_name = ?",
      userName,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if (result.length > 0) {

            compare(password, result[0]["company_password"], (err, resul) => {

               if (err){
                  console.log('compar...',err);
                  next(AppError.create(error, 500, "database Error"));
               } 
               if (resul) {
                  if(result[0]["security_key"] === secretKey) {
                  const token = createToken({
                     id: result[0]["company_id"],
                     userName: result[0]["company_name"],
                  });
               
                  if(process.env.NODE_ENV === "development")
                  res.cookie("token", token, {
                     secure: true,
                     httpOnly: true,
                     sameSite:"lax",
                     domain: process.env.DOMAIN,
                     path: "/en/company",
                     maxAge: 86400000,
                  });
                  if(process.env.NODE_ENV === "production")
                     res.cookie("token", token, {
                        secure: true,
                        httpOnly: true,
                        sameSite: "none",
                        // domain: process.env.DOMAIN,
                        // path: "/en/company",
                        maxAge: 86400000,
                     });



                  res.cookie("roomId", result[0]["room_ID"], {
                     secure: true,
                     httpOnly: true,
                     sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                     // domain: process.env.DOMAIN,
                     // path: "/en/company",
                     maxAge: 86400000,
                  });

                  RESPONSE.successHandler(res, 200, {
                     id: result[0]["company_id"],
                     userName: result[0]["company_name"],
                     cookies: res.getHeaders()['set-cookie']
                  });
                  return;
                  }
                  RESPONSE.errorHandler(res, 401, 
                     'the secret key is not correct'
                  );
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

const getCompany = (req, res, next)=>{
   
   console.log('user company.....',req.user);

   pool.query(
      "SELECT * FROM company WHERE company_name = ? ",
      [req.user.userName],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log(result);
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

const getRoomId =  (req, res, next)=>{
   console.log('user',req.user);
   pool.query(
      "SELECT room_ID FROM company WHERE company_name = ? ",
      [req.user.userName],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log(result);
         if (result.length > 0) {

            res.cookie("roomId", result[0]["room_ID"], {
               // secure: true,
               // httpOnly: true,
               sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
               domain: process.env.DOMAIN,
               path: "/en/company",
               maxAge: 86400000,
            });
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


const orderJoin = (req, res, next)=>{
   // console.log('user alazy',req.user);

   let {
      user_id,
      company_id,
      company_name,
      job
   } = req.body;

   const order = [user_id, req.user.id, company_name, job];

   pool.query(
      "INSERT INTO join_orders SET user_id = ?, company_id = ?, company_name = ?, job = ? ",
      order,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         RESPONSE.successHandler(res, 200, {
            ...result[0]
         });
      }
   );

}


const addEmployee =  (req, res, next)=>{

   let {user_id,company_id,job} = req.body;
   
   company_id = parseInt(company_id);
   let employee = [
      user_id,
      company_id,
      job
   ];
   
   console.log("employee onfo.....",employee);
   pool.query(
      "INSERT INTO employee SET user_id = ?, company_id = ?, job_for = ? ",
      employee,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }

         pool.query(
            "DELETE FROM join_orders WHERE user_id = ? AND company_id = ?",
            [user_id,company_id],
            (error, result, fields) => {
               if (error) {
                  console.log("delete join error >>>",error);
                  next(AppError.create(error, 500, "database Error"));
               }
               RESPONSE.successHandler(res, 200, {
                  message: "Order has been Accepted."
               });
            }
         );

      }
   );

}



const getAllEmployee = (req, res, next) => {

   const user = req.user;
   const searchParams = req.query;
   // const page = parseInt(searchParams.page);
   const page = searchParams.page;
   // const recordNumber = parseInt(searchParams.recordNumber);
   const recordNumber = searchParams.recordNumber;

   const offset = (page - 1) * recordNumber;

   pool.query(
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.user_name, user.public_name, user.email FROM employee INNER JOIN user USING(user_id) WHERE employee.company_id = ? LIMIT ${recordNumber} OFFSET ${offset} `,
      [user.id],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result....', result);
   
         // Execute the count query separately
         pool.query(
            `SELECT COUNT(*) AS count FROM employee WHERE company_id = ?`,
            [user.id],
            (countError, countResult) => {
               if (countError) {
                  console.log("count error", countError);
                  next(AppError.create(countError, 500, "database Error"));
               }
   
               const totalRows = countResult[0].count;
    
               RESPONSE.successHandler(res, 200, {
                  result: {
                     ...result
                  },
                  total: totalRows
               });
            }
         );

      }
   );
}


const searchUser = (req, res, next)=>{
   // console.log('user',req.user);
   let user = req.query.user;

   // console.log("user name/ / // / ///",user);

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
               ...result
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );

}

const searchEmployee = (req, res, next)=>{

   let user = req.query.employee;

    pool.query(
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email FROM employee INNER JOIN user USING(user_id) WHERE user.public_name LIKE ?`,
      [`%${user}%`],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result....', result);

         RESPONSE.successHandler(res, 200, {
            ...result
         });

      }
   );
}

const deleteEmployee = (req, res, next) => {

   const user = req.user;
   const searchParams = req.query.employeeId;
   
      pool.query('DELETE FROM employee WHERE employee_id = ?',[searchParams],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               delete: true
            });
         }
      );
}



module.exports = {
   create,
   searchByUserNameAndEmail,
   getSecretKey,
   login,
   getCompany,
   getRoomId,
   addEmployee,
   getAllEmployee,
   searchUser,
   orderJoin,
   deleteEmployee,
   searchEmployee
}

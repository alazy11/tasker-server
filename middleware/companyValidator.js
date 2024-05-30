const {body} = require('express-validator');
const pool = require('../model/db');


let userError;

function queryPool(value,query,errorMessage) {
   return new Promise((resolve,reject)=>{
      pool.query(query,[value],(error,result,fields)=>{
         if(error) {
            userError = new Error(error.message);
            return reject(userError)
         }
         if(result.length !== 0){
            userError = new Error(errorMessage);
            return reject(userError)
         }
         return resolve(userError)
      });
   })
}

let companyValidator = [
   body('userName','user name value is required !').notEmpty(),
   body('userName','user name has already exist !').custom(async value=>{
      try{
         const res1 = await queryPool(value,'SELECT company_name FROM company WHERE company_name = ? ','user name has already exist !');
         console.log('company name',res1);
      }catch(error){
         throw error
      }
   }),
   body('userName','user name has already exist !').custom(async value=>{
      try{
         const res = await queryPool(value,'SELECT user_name FROM user WHERE user_name = ? ','user name has already exist !');
         console.log('user name',res);
      }catch(error){
         throw error
      }
   }),
   body('name','public name value is required !').notEmpty(),
   body('phone','user phone value is required !').notEmpty(),
   body('phone','user phone most be just numbers !').isInt(),
   body('email','user email value is required !').notEmpty().trim(),
   body('email','enter a correct email !').isEmail(),
   body('email','user email has already exist !').custom(async value=>{
      try{
         const res1 = await queryPool(value,'SELECT email FROM company WHERE email = ? ','user email has already exist !');
         console.log('company email',res1);
      }catch(error){
         throw error
      }
   }),
   body('email','user email has already exist !').custom(async value=>{
      try{
         const res = await queryPool(value,'SELECT email FROM user WHERE email = ? ','user email has already exist !');
         console.log('user email',res);
      }catch(error){
         throw error
      }
   }),
   body('password','user password value is required !').notEmpty(),
   body('password','user password value is not in the correct length!').isLength({min:5,max:50}),
   body('job','user job value is required !').notEmpty(),
   body('country','user country value is required !').notEmpty(),
   body('secretKey','user secretKey value is required !').notEmpty(),
   // body('secretKey','user secretKey is not correct!').custom(async value=>{
   //    try{
   //       const res = await queryPool(value,'SELECT email FROM company WHERE email = ? ','user secretKey is not correct!');
   //       console.log('result===',res)
   //    }catch(error){
   //       throw error
   //    }
   // }),
];

module.exports = companyValidator;
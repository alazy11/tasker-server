const {body} = require('express-validator');
const pool = require('../model/db');


let userError;

function queryPool(value,query,errorMessage) {
    {
      
    }
}

let userValidator = [
   body('userName','user name value is required !').notEmpty(),
   body('userName','user name has already exist !').custom(async value=>{
      try{
         const res = await queryPool(value,'SELECT user_name FROM user WHERE user_name = ? ','user name has already exist !');
         // console.log('result===',res)
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
         const res = await queryPool(value,'SELECT email FROM user WHERE email = ? ','user email has already exist !');
         console.log('result===',res)
      }catch(error){
         throw error
      }
   }),
   body('password','user password value is required !').notEmpty(),
   body('password','user password value is not in the correct length!').isLength({min:5,max:50}),
   body('job','user job value is required !').notEmpty(),
   body('gender','user gender value is required !').notEmpty(),
   body('birthDate','user birthDate value is required !').notEmpty(),
   body('birthDate','user birthDate value is not correct !').isDate(),
   body('country','user country value is required !').notEmpty(),
];

module.exports = userValidator;
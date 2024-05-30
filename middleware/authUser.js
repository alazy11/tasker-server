const {verify} = require('jsonwebtoken');
const AppError = require('../util/customError');
// require('dotenv').config()
// const {process} = require('node:process');

const authJWTUser = (req,res,next)=>{
   // let token = req.headers.authorization?.split(' ')[1];
   let token = req.cookies["token"] || req.headers.authorization?.split(' ')[1];
   // let token = req.headers.cookies;
   // console.log('token....hh',token)
   if(token) {
      // console.log('token....',token)
      try{
         const user = verify(token, process.env.JWT_SECRET_KEY);
         // console.log('user cookie', user);
         req.user = user;
         next();
      } catch (err) {
         console.log('jwt ver',err)
         next(AppError.create('Unauthorized', 401, "jwt error"));
      }
   } else {
      console.log('user Unauthorized', user);
      next(AppError.create('Unauthorized', 401, "jwt error"));
   }
}

module.exports = authJWTUser;

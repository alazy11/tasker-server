const {verify} = require('jsonwebtoken');
const AppError = require('../util/customError');
// require('dotenv').config()
// const {process} = require('node:process');

const authJWTUser = (req,res,next)=>{
   // let token = req.headers.authorization?.split(' ')[1];
   let token = req.cookies["token"] || req.headers.authorization?.split(' ')[1];
   let sender = req.query.sender;
   // console.log("req.query.sender.........",sender)
   // let token = req.cookies["token"];
   let user;
   let nextFun = next;
   // let token = req.headers.cookies;
   // console.log('token....hh',token)
   if(token) {
      // console.log('token....sssssss',token)
      try{
         user = verify(token, process.env.JWT_SECRET_KEY);
         // console.log('user cookie', verify(token, process.env.JWT_SECRET_KEY));
         req.user = user;
         nextFun();
         // console.log('user cookie after .....', req.user);
         return;
      } catch (err) {
         // console.log('user cookie error,,,',err)
         console.log('jwt ver',err)
         next(AppError.create('Unauthorized user', 401, "jwt error"));
      }
      return;
   } else {
      console.log('user Unauthorized', user);
      next(AppError.create('Unauthorized', 401, "jwt error"));
   }

}

module.exports = authJWTUser;

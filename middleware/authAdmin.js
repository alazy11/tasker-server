
// const AppError = require("../util/customError");
const { validationResult } = require("express-validator");
const RESPONSE = require("../handlers/errorHandler");


const authAdminIsLog = (req,res,next)=>{
   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let { userName, password } = req.body;
   console.log('admin...input')
   if(userName === process.env.ADMIN_USER_NAME && password === process.env.ADMIN_PASSWORD) {
      console.log('admin...ok')
      console.log('admin...ok'+req.params['lang']);
      console.log(req.protocol+req.hostname+req.params.lang+'/login/admin')
      // res.redirect('/en/login/admin');
      // res.redirect(req.get('origin')+'/en/login/admin');
      return RESPONSE.successHandler(res, 200, {
         redirect:req.get('origin')+'/en/login/admin'
      });
      // return;
   } else {
      console.log('admin...no')
      next();
   }
}

module.exports = authAdminIsLog;
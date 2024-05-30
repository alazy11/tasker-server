const { Router } = require('express');
const User = require('../controller/userController');
const Company = require('../controller/companyController');
const Admin = require('../controller/adminController');
const userLoginValidator = require('../middleware/userLoginValidator');
const companyLoginValidator = require('../middleware/companyLoginValidator');
const authAdminIsLog = require('../middleware/authAdmin');

const login = Router();

login.route('/user').post(userLoginValidator,authAdminIsLog,User.login);
login.route('/company').post(companyLoginValidator,Company.login);
login.route('/admin').post(userLoginValidator,Admin.login);


module.exports = {
   login
}
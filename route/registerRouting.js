const { Router } = require('express');
const User = require('../controller/userController');
const Company = require('../controller/companyController');
const userValidator = require('../middleware/userValidator');
const companyValidator = require('../middleware/companyValidator');

const register = Router();

register.route('/').post(userValidator,User.create).get(User.searchByUserNameAndEmail);
register.route('/company').post(companyValidator,Company.create).get(Company.searchByUserNameAndEmail);
register.route('/company/getSecretKey').get(Company.getSecretKey);



module.exports = {
   register
}
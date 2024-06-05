const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Company = require('../controller/companyController');
const checkEmployee = require('../middleware/checkEmployee');
const checkExistenceOrderJoin = require('../middleware/company_middleware/checkExistenceOrderJoin');
const isAlreadyEmployee = require('../middleware/user_middleware/isAlreadyEmployee');


const COMPANY = Router();

COMPANY.route('/').get((res,req,next)=>{
   console.log('ok copklasjnoipjp wsckjpowcpn ')
   next()
},authJWTUser,(res,req,next)=>{
   console.log('ok dfsssssssss wsckjpowcpn ')
   next()
},Company.getCompany);
COMPANY.route('/search').get(authJWTUser,Company.searchUser);
COMPANY.route('/employee/search').get(authJWTUser,Company.searchEmployee);
COMPANY.route('/roomId').get(authJWTUser,Company.getRoomId);
COMPANY.route('/employee').post(authJWTUser,checkEmployee,Company.addEmployee);
COMPANY.route('/employee').get(authJWTUser,Company.getAllEmployee);
COMPANY.route('/employee').delete(authJWTUser,Company.deleteEmployee);
COMPANY.route('/join').post(authJWTUser,isAlreadyEmployee,checkExistenceOrderJoin,Company.orderJoin);

module.exports = COMPANY;
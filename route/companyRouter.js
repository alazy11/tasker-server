const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Company = require('../controller/companyController');
const checkEmployee = require('../middleware/checkEmployee');
const checkExistenceOrderJoin = require('../middleware/company_middleware/checkExistenceOrderJoin');
const isAlreadyEmployee = require('../middleware/user_middleware/isAlreadyEmployee');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');


const clipPath= async(req, res, next)=> {


    const folderPathTask= path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`clip`);
    const folderPathDatabase = path.join('uploads', 'company', `${req.user.id}`,`clip`);
 
 
    fs.mkdir(folderPathTask,{ recursive: true },(err)=>{
        console.log('folder error ...',err)
    });
 
    req.destinationPath = folderPathTask;
    req.folderPath = folderPathDatabase;
 
    next();
 }

const storageClip = multer.diskStorage({
    destination: (req, file, cb) => {
       const destinationPath  = req.destinationPath;
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname;
        req.fileName = file.originalname;
        cb(null, fileName)
    }
 });
 
 const uploadClip = multer({
    storage: storageClip,
 });


const COMPANY = Router();

COMPANY.route('/').get(authJWTUser,Company.getCompany);
COMPANY.route('/logout').get(authJWTUser,Company.logout);
COMPANY.route('/note').post(authJWTUser,Company.createNote).get(authJWTUser,Company.getAllNote).put(authJWTUser,Company.editNote).delete(authJWTUser,Company.deleteNote);
COMPANY.route('/clip').post(authJWTUser,clipPath,uploadClip.array('file'),Company.uploadClip).get(authJWTUser,Company.getAllClip);
COMPANY.route('/clip/save').post(authJWTUser,Company.saveClip);
COMPANY.route('/clip/:clipID').get(authJWTUser,Company.getClip);
COMPANY.route('/companyInfo').get(authJWTUser,Company.getCompanyInfo);
COMPANY.route('/search').get(authJWTUser,Company.searchUser);
COMPANY.route('/getUserInformation').get(authJWTUser,Company.getUserInformation);
COMPANY.route('/employee/search').get(authJWTUser,Company.searchEmployee);
COMPANY.route('/roomId').get(authJWTUser,Company.getRoomId);
COMPANY.route('/employee').post(authJWTUser,checkEmployee,Company.addEmployee);
COMPANY.route('/employee').get(authJWTUser,Company.getAllEmployee);
COMPANY.route('/employee').delete(authJWTUser,Company.deleteEmployee);
COMPANY.route('/join').post(authJWTUser,isAlreadyEmployee,checkExistenceOrderJoin,Company.orderJoin);

module.exports = COMPANY;
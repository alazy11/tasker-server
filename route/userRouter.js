const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const User = require('../controller/userController');
const Space = require('../controller/user/spaceController');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const getUserCompany = require('../util/getUserCompany')
const {isUserInSpace} = require('../middleware/isInSpace');


async function setDest(req,res,next) {

   const spaceID = req.params.spaceID;
   const company_id = await getUserCompany(req.user.id);

   req.destinationPath = path.join(req.FolderPath,'uploads', 'company', `${company_id}`,`space`,`${spaceID}`,'chat');

   next();

}


const clipPath= async(req, res, next)=> {


   const folderPathTask= path.join(req.FolderPath, 'uploads', 'user', `${req.user.id}`,`clip`);
   const folderPathDatabase = path.join('uploads', 'user', `${req.user.id}`,`clip`);


   fs.mkdir(folderPathTask,{ recursive: true },(err)=>{
       console.log('folder error ...',err)
   });

   req.destinationPath = folderPathTask;
   req.folderPath = folderPathDatabase;

   next();
}



const generateRequestId = async(req, res, next)=> {

   const {projectID,spaceID} = req.params;

   const company_id = await getUserCompany(req.user.id);
   const taskID = req.header('taskID');
   const folderPathTask= path.join(req.FolderPath, 'uploads', 'company', `${company_id}`,`space`,`${spaceID}`,'project',`${projectID}`,`pullRequest`,`${taskID}`);
   const folderPathDatabase = path.join('uploads', 'company', `${company_id}`,`space`,`${spaceID}`,'project',`${projectID}`,`pullRequest`,`${taskID}`);


   fs.mkdir(folderPathTask,{ recursive: true },(err)=>{
       console.log('folder error ...',err)
   });

   req.destinationPath = folderPathTask;
   req.pullID = taskID;
   req.folderPath = folderPathDatabase;

   next();
}


const storagePull = multer.diskStorage({
   destination: (req, file, cb) => {
      const destinationPath  = req.destinationPath;
       cb(null, destinationPath);
   },
   filename: (req, file, cb) => {

      console.log("originalname", file.originalname)
       const fileName = file.originalname.toLowerCase().split(' ').join('-');
       cb(null, fileName)
   }
});
const uploadPull = multer({
   storage: storagePull,
});



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






const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const destinationPath  = req.destinationPath;
       cb(null, destinationPath);
   },
   filename: (req, file, cb) => {
       const fileName = file.originalname.toLowerCase().split(' ').join('-') + new Date().getTime();
       cb(null, fileName)
   }
});

const upload = multer({
   storage: storage,
});



const USER = Router();

USER.route('/').get(authJWTUser,User.getUser);
USER.route('/note').post(authJWTUser,User.createNote).get(authJWTUser,User.getAllNote).put(authJWTUser,User.editNote).delete(authJWTUser,User.deleteNote);
USER.route('/clip').post(authJWTUser,clipPath,uploadClip.array('file'),User.uploadClip).get(authJWTUser,User.getAllClip);
USER.route('/clip/save').post(authJWTUser,User.saveClip);
USER.route('/clip/:clipID').get(authJWTUser,User.getClip);
USER.route('/task').get(authJWTUser,User.getAllTasks);
USER.route('/task/download').get(authJWTUser,User.downloadTaskFile);
USER.route('/getUserInformation').get(authJWTUser,User.getUserInformation);
USER.route('/meeting').get(authJWTUser,User.isThereMeeting)
USER.route('/space').get(authJWTUser,Space.getUserSpaces);
USER.route('/space/:spaceID').get(authJWTUser,Space.getSpace);
USER.route('/space/:spaceID/meeting').post(authJWTUser,Space.setMeeting);
USER.route('/space/:spaceID/meeting/:meet').get(authJWTUser,isUserInSpace,Space.isValidMeeting);
USER.route('/space/:spaceID/chat').get(authJWTUser,Space.getSpaceMessage).delete(authJWTUser,Space.deleteSpaceMessage);
USER.route('/space/:spaceID/chat/download').get(authJWTUser,Space.downloadFile);
USER.route('/space/:spaceID/chat/upload').post(authJWTUser,setDest,upload.array('file'),Space.uploadSpaceFileChat);
USER.route('/space/:spaceID/project/:projectID/request').post(authJWTUser,User.pullRequest);
USER.route('/space/:spaceID/project/:projectID/request/upload').post(authJWTUser,generateRequestId,uploadPull.array('file'),User.uploadFileTask);
USER.route('/search').get(authJWTUser,User.searchUser);
USER.route('/join').get(authJWTUser,User.gatAllOrderJoin);
USER.route('/join').post(authJWTUser,User.acceptOrder);
USER.route('/join').delete(authJWTUser,User.deleteOrder);

module.exports = USER;
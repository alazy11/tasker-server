const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Project = require('../controller/projectController');
const spaceValidator = require('../middleware/spaceValidator');
const multer = require('multer');


const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const destinationPath  = req.destinationPath;
       cb(null, destinationPath);
   },
   filename: (req, file, cb) => {
       const fileName = file.originalname.toLowerCase().split(' ').join('-');
       cb(null, fileName)
   }
});

const upload = multer({
   storage: storage,
   // fileFilter: (req, file, cb) => {
   //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
   //         cb(null, true);
   //     } else {
   //         cb(null, false);
   //         return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
   //     }
   // }
});


const PROJECT = Router();

PROJECT.route('/').get(authJWTUser,Project.getAllProjects).post(authJWTUser,Project.create);
PROJECT.route('/phase').post(authJWTUser,Project.AddPhases);
PROJECT.route('/:projectID/setting/block').post(authJWTUser,Project.preventUserToSeeFile).get(authJWTUser,Project.getPreventUserToSeeFile)
.delete(authJWTUser,Project.allowUserToSeeFile);
PROJECT.route('/:projectID/task/setting/block').post(authJWTUser,Project.preventUserToPullRequest).get(authJWTUser,Project.getPreventUserToPullRequest)
.delete(authJWTUser,Project.allowUserToPullRequest);
PROJECT.route('/:projectID/phase').get(authJWTUser,Project.getPhase);
PROJECT.route('/:projectID/folder').get(authJWTUser,Project.getAllFolder).post(authJWTUser,Project.createFolder);
PROJECT.route('/:projectID/folder/:folderID').get(authJWTUser,Project.getSubFolderAndFile).put(authJWTUser,Project.renameFolder).delete(authJWTUser,Project.deleteFolder);
PROJECT.route('/:projectID/folder/:FolderName/get').get(authJWTUser,Project.getFolder);
PROJECT.route('/:projectID/folder/:folderID/file').post(authJWTUser,upload.array('file'),Project.createFile).put(authJWTUser,Project.renameFile).delete(authJWTUser,Project.deleteFile);
PROJECT.route('/:projectID/folder/:folderID/download/file').get(authJWTUser,Project.downloadFile);
PROJECT.route('/:projectID/folder/:folderID/download').get(authJWTUser,Project.downloadFolder);
PROJECT.route('/tag').get(authJWTUser,Project.getAllTags);
PROJECT.route('/:projectID').get(authJWTUser,Project.getProject).delete(authJWTUser,Project.deleteProject);


module.exports = PROJECT;
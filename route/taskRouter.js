const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Task = require('../controller/taskController');
const spaceValidator = require('../middleware/spaceValidator');
const multer = require('multer');
const fs = require('node:fs');
const path = require('node:path');


const TASK = Router();

const generateTaskId = (req, res, next)=> {

    const {projectID,spaceID} = req.par;

    // const taskID = spaceID + require('crypto').randomBytes(5).toString('hex');
    const taskID = req.header('taskID');
    const folderPathTask= path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,'project',`${projectID}`,`task`,`${taskID}`);
    const folderPathDatabase = path.join('uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,'project',`${projectID}`,'task',`${taskID}`);


    fs.mkdir(folderPathTask,{ recursive: true },(err)=>{
        console.log('folder error ...',err)
    });



    // const destinationPath  = path.join(`${req.FolderPath}`,`${req.header('folderFilePath')}`);
    req.destinationPath = folderPathTask;
    req.taskID = taskID;
    req.folderPath = folderPathDatabase;

    next();
}



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


TASK.route('/').get(authJWTUser,Task.getAllTask).post(authJWTUser,Task.create);
TASK.route('/tag').get(authJWTUser,Task.getAllTags);
TASK.route('/file/upload').post(authJWTUser,generateTaskId,upload.array('file'),Task.uploadFileTask);
TASK.route('/:taskID').get(authJWTUser,Task.getTask).delete(authJWTUser,Task.deleteTask).put(authJWTUser,Task.update);
// PROJECT.route('/:projectID').get(authJWTUser,Project.getProject).delete(authJWTUser,Project.deleteProject);


module.exports = TASK;
const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Space = require('../controller/spaceController');
const spaceValidator = require('../middleware/spaceValidator');
const isAlreadyInSpace = require('../middleware/space_middleware/isAlreadyInSpace')
const multer = require('multer');
const path = require('node:path');
const {isCompanyInSpace} = require('../middleware/isInSpace');

function setDest(req,res,next) {

   const spaceID = req.params.spaceID;

   req.destinationPath = path.join(req.FolderPath,'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,'chat');

   next();

}



const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const destinationPath  = req.destinationPath;
       cb(null, destinationPath);
   },
   filename: (req, file, cb) => {
      let fileAdd = file.originalname.toLowerCase().split(' ').join('-');
      fileAdd = fileAdd.split('.');
      fileAdd[0] = fileAdd[0] + new Date().getTime();
      const fileName = fileAdd.join('.');
      //  const fileName = file.originalname.toLowerCase().split(' ').join('-') + new Date().getTime();
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


const SPACE = Router();

SPACE.route('/').post(authJWTUser,spaceValidator,Space.create).get(authJWTUser,Space.getAllSpaces).put(authJWTUser,Space.updateSpace);
SPACE.route('/user').get(authJWTUser,Space.getAcceptUserSpaces);
SPACE.route('/:spaceID').get(authJWTUser,Space.getSpace).delete(authJWTUser,Space.deleteSpace);
SPACE.route('/:spaceID/rename').put(authJWTUser,Space.renameSpace);
SPACE.route('/:spaceID/manager').post(authJWTUser,Space.assignManager);
SPACE.route('/:spaceID/user').post(authJWTUser,Space.setMemberInSpace);
SPACE.route('/:spaceID/manager/role').post(authJWTUser,Space.roleManager).get(authJWTUser,Space.setRoleManager);
SPACE.route('/:spaceID/meeting').post(authJWTUser,Space.setMeeting);
SPACE.route('/:spaceID/meeting/:meet').get(authJWTUser,isCompanyInSpace,Space.isValidMeeting).put(authJWTUser,Space.updateMeeting);
SPACE.route('/:spaceID/chat').get(authJWTUser,Space.getSpaceMessage).delete(authJWTUser,Space.deleteSpaceMessage);
SPACE.route('/:spaceID/chat/setting').put(authJWTUser,Space.setting);
SPACE.route('/:spaceID/chat/setting/block').get(authJWTUser,Space.getBlockList);
SPACE.route('/:spaceID/chat/setting/lock').get(authJWTUser,Space.getLockList);
SPACE.route('/:spaceID/chat/setting/block/:userID').put(authJWTUser,Space.blockChatUser);
SPACE.route('/:spaceID/chat/setting/lock/:userID').put(authJWTUser,Space.lockChatUser);
SPACE.route('/:spaceID/chat/upload').post(authJWTUser,setDest,upload.array('file'),Space.uploadSpaceFileChat);
SPACE.route('/:spaceID/chat/download').get(authJWTUser,Space.downloadFile);
SPACE.route('/:spaceID/members').get(authJWTUser,Space.getAllMembersSpace).post(authJWTUser,isAlreadyInSpace,(req,res,next)=>{req.response = true; next();},Space.setMemberInSpace).delete(authJWTUser,Space.deleteMember);
SPACE.route('/:spaceID/members/search').get(authJWTUser,Space.searchMember);
SPACE.route('/archive/:spaceID').get(authJWTUser,Space.setSpaceInArchive);

module.exports = SPACE;
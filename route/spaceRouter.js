const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Space = require('../controller/spaceController');
const spaceValidator = require('../middleware/spaceValidator');
const isAlreadyInSpace = require('../middleware/space_middleware/isAlreadyInSpace')


const SPACE = Router();

SPACE.route('/').post(authJWTUser,spaceValidator,Space.create).get(authJWTUser,Space.getAllSpaces).put(authJWTUser,Space.updateSpace);
SPACE.route('/:spaceID').get(authJWTUser,Space.getSpace).delete(authJWTUser,Space.deleteSpace);
SPACE.route('/:spaceID/members').get(authJWTUser,Space.getAllMembersSpace).post(authJWTUser,isAlreadyInSpace,(req,res,next)=>{req.response = true; next();},Space.setMemberInSpace).delete(authJWTUser,Space.deleteMember);
SPACE.route('/:spaceID/members/search').get(authJWTUser,Space.searchMember);
SPACE.route('/archive/:spaceID').get(authJWTUser,Space.setSpaceInArchive);

module.exports = SPACE;
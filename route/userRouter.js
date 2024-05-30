const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const User = require('../controller/userController');

const USER = Router();

USER.route('/').get(authJWTUser,User.getUser);
USER.route('/search').get(authJWTUser,User.searchUser);
USER.route('/join').get(authJWTUser,User.gatAllOrderJoin);
USER.route('/join').post(authJWTUser,User.acceptOrder);
USER.route('/join').delete(authJWTUser,User.deleteOrder);

module.exports = USER;
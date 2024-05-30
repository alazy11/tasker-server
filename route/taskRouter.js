const { Router } = require('express');
const authJWTUser = require('../middleware/authUser');
const Task = require('../controller/taskController');
const spaceValidator = require('../middleware/spaceValidator');



const TASK = Router();

TASK.route('/').post(authJWTUser,Task.create);
TASK.route('/tag').get(authJWTUser,Task.getAllTags);
// PROJECT.route('/:projectID').get(authJWTUser,Project.getProject).delete(authJWTUser,Project.deleteProject);


module.exports = TASK;
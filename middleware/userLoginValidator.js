const {body} = require('express-validator');

let userLoginValidator = [
   body('userName','user name value is required !').notEmpty(),
   body('password','user password value is required !').notEmpty(),
];

module.exports = userLoginValidator;
const {body} = require('express-validator');

let companyLoginValidator = [
   body('userName','user name value is required !').notEmpty(),
   body('password','user password value is required !').notEmpty(),
   body('password','user password value is not in the correct length!').isLength({min:5,max:50}),
   body('secretKey','user secretKey value is required !').notEmpty(),
];

module.exports = companyLoginValidator;
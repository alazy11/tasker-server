const {body} = require('express-validator');


// company_id,
// title,
// description,
// icon,
// textIcon,
// pathIconSpace


let spaceValidator = [
   body('company_id','user name value is required !').notEmpty(),
   body('title','space title value is required !').notEmpty(),
];

module.exports = spaceValidator;
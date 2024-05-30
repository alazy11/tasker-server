const jwt = require('jsonwebtoken');
require('dotenv').config();


function createToken(payload) {
   const token = jwt.sign(payload,process.env.JWT_SECRET_KEY,{expiresIn:'1d'});
   return token;
}

module.exports = createToken;
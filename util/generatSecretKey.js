const crypto = require('node:crypto');
const RESPONSE = require('../handlers/errorHandler');

function key() {
   const arr = [1,2,3,4,5,6,7,8,9,'a','b','c'];
   // let key = Math.random()
   return new Promise((resolve,reject)=>{
      crypto.generateKey('hmac', { length: 5 },(err, key) => {
         if (err){
            console.log('secret error',err);
            return reject(err);
         }
         return resolve(key.export().toString('hex'));
         });
   })
}


function generatSecretKey(companyName) {
   console.log('ok generate function');
   let secretKey;
   try{
      // secretKey = await key();
      secretKey = companyName + 123;
      // console.log("secretKey",secretKey)
      return secretKey;
   } catch(error) {
      RESPONSE.errorHandler(res,500,error)
   }
}

module.exports = generatSecretKey;
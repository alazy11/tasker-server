const pool = require("../model/db");

const storeSpaceMessage = async(message)=>{

   const msg = [message.room_id, message.user_id, message.company_id, message.send_date, message.send_time, message.ms_type, message.conten, message.size, message.name];

   return new Promise((resolve,reject)=>{

      pool.query(
         `INSERT INTO space_message_${message.spaceID} SET room_id = ?, user_id = ?, company_id = ?, send_date = ?, send_time = ?, ms_type = ?, conten = ?, size = ?, name = ?`,
         msg,
         (error, result, fields) => {
            if (error) {
               console.log(error);
               reject({
                     isStored: false
                  });
            }
            // console.log("storeSpaceMessage",result.insertId)
            resolve({
               isStored: true,
               ms_id: result.insertId
            });
         }
      );

   })

}


module.exports = {
   storeSpaceMessage
}
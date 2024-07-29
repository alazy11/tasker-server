

const pool = require("../model/db");

const deleteMeeting = ({creator = '', meetingID = ''})=>{

   if(creator) {
      return new Promise((resolve,reject)=>{
         pool.query(
             `DELETE FROM meeting WHERE creator = ?`,[creator],
             (error, result, fields) => {
                if (error) {
                   console.log("sql error", error);
                   reject(error)
                 //   next(AppError.create(error, 500, "database Error"));
                   return;
                }
              //   if(result.length > 0) {
                 console.log('ok delete')
                 resolve(true)
              //   } else {
              //    resolve(false)  
              //   }
             }
          )
     
         })
   } else {
      return new Promise((resolve,reject)=>{
         pool.query(
             `DELETE FROM meeting WHERE meet_id = ?`,[meetingID],
             (error, result, fields) => {
                if (error) {
                   console.log("sql error", error);
                   reject(error)
                 //   next(AppError.create(error, 500, "database Error"));
                   return;
                }
              //   if(result.length > 0) {
                 console.log('ok delete')
                 resolve(true)
              //   } else {
              //    resolve(false)  
              //   }
             }
          )
     
         })
   }

}

module.exports = deleteMeeting;
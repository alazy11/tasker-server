const RESPONSE = require('../../handlers/errorHandler');
const pool = require('../../model/db');
const AppError = require('../../util/customError');
const {validationResult} = require('express-validator');
const getUser = require('../../util/chatSpace/getUser');
const getCompany = require('../../util/chatSpace/getCompany');

const getUserSpaces = (req, res, next)=>{

   // console.log('user - spaces - id',req.user)

 pool.query(
      `SELECT space.space_id,space.company_id,space.title,space.description, space.icon, space.icon_text, space.icon_path, space.color, space.room_id, space_members.employee_id FROM space_members INNER JOIN space USING(space_id) WHERE space_members.employee_id IN(SELECT employee_id FROM employee WHERE user_id = ?)`,
      [req.user.id],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result....', result);

         RESPONSE.successHandler(res, 200, {
            ...result
         });

      }
   );

}

const getSpace = (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;
   let employeeId = '';

   console.log("employeeId",employeeId)

   pool.query(
      `SELECT * FROM space WHERE space_id = ?`,
      [searchParams],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         pool.query(
            `SELECT employee_id FROM employee WHERE user_id = ?`,[user.id],
            (error, result1, fields) => {
               if (error) {
                  console.log("sql error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }

               employeeId = result1[0].employee_id;
      
               pool.query(
                  `SELECT * FROM space_members WHERE employee_id = ?`,[employeeId],
                  (error, result2, fields) => {
                     if (error) {
                        console.log("sql error", error);
                        next(AppError.create(error, 500, "database Error"));
                        return;
                     }
            
                     RESPONSE.successHandler(res, 200, {
                        ...result[0],
                        ...result2[0]
                     });
            
                  }
               )
      
            }
         )

      }
   );
}


const uploadSpaceFileChat = (req, res, next) => {

  console.log(req.files[0].path.substr(req.files[0].path.indexOf('uploads')))
   RESPONSE.successHandler(res, 200, {
      file:req.files[0].path.substr(req.files[0].path.indexOf('uploads'))
   });

}


const getSpaceMessage = (req, res, next) => {

   const spaceID = req.params.spaceID;
   const searchParams = req.query;
   // const page = parseInt(searchParams.page);
   const page = searchParams.page;
   // const recordNumber = parseInt(searchParams.recordNumber);
   const recordNumber = searchParams.recordNumber;

   const offset = (page - 1) * recordNumber;


   pool.query(
      `SELECT * FROM space_message_${spaceID} ORDER BY ms_id DESC LIMIT ${recordNumber} OFFSET ${offset}`,
      async (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

      let FinalResult = [];

if(result.length > 0) {

   FinalResult = result.map(async (message,index)=>{

      let ele = {};
      if(message.user_id) {
         try {
            const user = await getUser(message.user_id);
            ele = {
               ...message,
               ...user
            }
            return ele;
         } catch(err) {
            console.log(err)
         }

      } else {

         try {
            const user = await getCompany(message.company_id);
            ele = {
               ...message,
               ...user
            }
            return ele;
         } catch(err) {
            console.log(err)
         }

      }

   }
)

FinalResult = await Promise.all(FinalResult);


pool.query(
   `SELECT COUNT(*) AS count FROM space_message_${spaceID}`,
   (countError, countResult) => {
      if (countError) {
         console.log("count error", countError);
         next(AppError.create(countError, 500, "database Error"));
      }

      const totalRows = countResult[0].count;

      RESPONSE.successHandler(res, 200, {
         result: FinalResult,
         total: totalRows
      });
   }
);

return;

} else {

   RESPONSE.successHandler(res, 200, FinalResult);

}

      }
   );


}



const deleteSpaceMessage = (req, res, next) => {

   const spaceID = req.params.spaceID;
   const messageId = req.query.messageId;
   const messageType = req.query.messageType;

   console.log("messageType",messageType)

   pool.query(
      `DELETE FROM space_message_${spaceID} WHERE ms_id = ?`,[messageId],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            message:'delete successfully.'
         });

      }
   )

}


const downloadFile = (req, res, next)=>{

   // let {file_path,name} = JSON.parse(req.query.file);
   let filePath = req.query.filePath;
   let fileName = req.query.fileName;

res.download(filePath,fileName, (err) => {
   if (err) {
     console.error('Error downloading file:', err);
   } else {
     console.log('File downloaded successfully!');
   }
 });

}



const setMeeting = (req, res, next)=>{

   const {creator} = req.body;
   const spaceID = req.params.spaceID;

   const meetId = v4();


   pool.query(
      `INSERT INTO meeting SET meet_id = ?, creator = ?, space_id = ?`,[meetId,creator,spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            creator : creator,
            meetId:meetId
         });

      }
   )
}




const isValidMeeting = (req, res, next)=>{

   const meetingId = req.params.meet;
   const spaceID = req.params.spaceID;

   pool.query(
      `SELECT * FROM meeting WHERE meet_id = ? AND space_id = ?`,[meetingId,spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         if(result.length > 0) {

            RESPONSE.successHandler(res, 200, {
               message:true,
               ...result[0]
            });

         } else {

            RESPONSE.successHandler(res, 200, {
               message:false
            });

         }
      }
   )
}




module.exports = {
   getUserSpaces,
   getSpace,
   uploadSpaceFileChat,
   getSpaceMessage,
   deleteSpaceMessage,
   downloadFile,
   isValidMeeting,
   setMeeting
}
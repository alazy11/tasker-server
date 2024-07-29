const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');
const {validationResult} = require('express-validator');
const fs = require('node:fs');
const path = require('node:path');



const create = (req, res, next)=> {

   const {projectID,spaceID,title,state,manager,priority,selectedTags,startDate,endDate,desc,folderPath,attachment,downloadPath} = req.body;
   let taskID;
   let task ;
   if(attachment.taskID) {
      taskID = attachment.taskID;
      task = [taskID,projectID,manager.toString(),title,desc,startDate,endDate,state,priority,folderPath, attachment.folderPath]
   } else {
      taskID = spaceID + require('crypto').randomBytes(5).toString('hex');
      task = [taskID,projectID,manager.toString(),title,desc,startDate,endDate,state,priority,folderPath, downloadPath];
   }

   let tasktag = [];

   // console.log("tasktask",task);

   // RESPONSE.successHandler(res, 200, task);

   pool.query(`INSERT INTO task_${spaceID} SET
      task_id = ?,
      project_id = ?, 
      user_id = ?,
      title = ?,
      description = ?,
      start_date = ?,
      end_date = ?,
      state = ?,
      priority = ?,
      folder_path = ?,
      download_folder_path = ?

   `,task,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      if(selectedTags.length > 0) {

      pool.query(`SELECT task_id
      FROM task_${spaceID}
      ORDER BY task_id DESC
      LIMIT 1;
      `,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         // console.log("task_id",result[0].task_id)

         try{
            selectedTags?.forEach(element => {
               tasktag.push([result[0].task_id,element])
            });
      
         } catch(err) {
            console.log("dikjbhfd",err)
         }


      pool.query(`INSERT INTO task_tag_${spaceID} (task_id,tag_name) VALUES ?`,[tasktag],(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         
         RESPONSE.successHandler(res, 200, {
            msg : 'ok created'
         });
   
      })
   
      })

   } else {
      
      RESPONSE.successHandler(res, 200, {
         msg : 'ok created'
      });
   }

   })

}




const getAllTags = (req, res, next)=> {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   const projectID = searchParams.projectID;
   
   pool.query(`SELECT DISTINCT task_tag_${spaceID}.tag_name FROM task_tag_${spaceID} INNER JOIN task_${spaceID} ON task_tag_${spaceID}.task_id = ANY (SELECT task_id FROM task_${spaceID} WHERE project_id = ?)`,[projectID],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      // console.log("result tags === ...", result);
      RESPONSE.successHandler(res, 200, {
         ...result
      });
   }
);
}


const getAllTask = (req, res, next)=> {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   const projectID = searchParams.projectID;
   const user = req.user;
// const page = parseInt(searchParams.page);
const page = searchParams.page;
// const recordNumber = parseInt(searchParams.recordNumber);
const recordNumber = searchParams.recordNumber;
const offset = (page - 1) * recordNumber;

console.log("projectIDprojectID",projectID)
   
   // pool.query(`SELECT * FROM task_${spaceID} WHERE project_id = ? LIMIT ${recordNumber} OFFSET ${offset}`,[projectID],(error,result,fields)=>{
   pool.query(`SELECT task_${spaceID}.task_id,user.user_id, user.public_name, user.profile_path ,task_${spaceID}.title ,task_${spaceID}.description ,task_${spaceID}.state ,task_${spaceID}.priority, task_${spaceID}.start_date, task_${spaceID}.end_date FROM task_${spaceID} INNER JOIN user ON (task_${spaceID}.user_id = user.user_id) WHERE task_${spaceID}.project_id = ?  LIMIT ${recordNumber} OFFSET ${offset}`,[projectID],(error,result,fields)=>{
      if (error) {
         console.log('errrrr',error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(
         `SELECT COUNT(*) AS count FROM space WHERE company_id = ?`,
         [user.id],
         (countError, countResult) => {
            if (countError) {
               console.log("count error", countError);
               next(AppError.create(countError, 500, "database Error"));
               return;
            }

            const totalRows = countResult[0].count;
 
            RESPONSE.successHandler(res, 200, {
               result: {
                  ...result
               },
               total: totalRows
            });
         }
      );

   }

);

}


const getTask = (req, res, next) => {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   const taskID = req.params.taskID;

   pool.query(`SELECT task_${spaceID}.task_id ,user.user_id, user.public_name, user.profile_path ,task_${spaceID}.title ,task_${spaceID}.description ,task_${spaceID}.state,task_${spaceID}.folder_path ,task_${spaceID}.priority, task_${spaceID}.start_date, task_${spaceID}.end_date FROM task_${spaceID} INNER JOIN user ON (task_${spaceID}.user_id = user.user_id) WHERE task_${spaceID}.task_id = ?`,[taskID],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      // console.log("result delete space...", result);
      RESPONSE.successHandler(res, 200, {
         ...result[0]
      });
   }
);


}


const update = (req, res, next)=> {

   const taskID = req.params.taskID;

   const {projectID,spaceID,title,state,manager,priority,selectedTags,phases,startDate,endDate,desc,folderPath} = req.body;
   let tasktag = [];
   const task = [phases,projectID,manager.toString(),title,desc,startDate,endDate,state,priority,folderPath,taskID];


   pool.query(`UPDATE task_${spaceID} SET
      
      phase_id = ?,
      project_id = ?, 
      user_id = ?,
      title = ?,
      description = ?,
      start_date = ?,
      end_date = ?,
      state = ?,
      priority = ?,
      folder_path = ?

      WHERE task_id = ?

   `,task,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }


      if(selectedTags.length > 0) {

         try{
            selectedTags?.forEach(element => {
               tasktag.push([element])
            });
      
         } catch(err) {
            console.log("dikjbhfd",err)
         }


      pool.query(`UPDATE task_tag_${spaceID} (tag_name) VALUES ? WHERE task_id = ${taskID}`,[tasktag],(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         
         RESPONSE.successHandler(res, 200, {
            msg : 'ok created'
         });
   
      })

   } else {
      
      RESPONSE.successHandler(res, 200, {
         msg : 'ok created'
      });
   }

   })

}



const deleteTask = (req, res, next)=> {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   // const projectID = searchParams.projectID;
   const taskID = req.params.taskID;

   pool.query(`DELETE FROM task_${spaceID} WHERE task_id = ?`,[taskID],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      // console.log("result delete space...", result);
      RESPONSE.successHandler(res, 200, {
         delete: true
      });
   }
);

}


const uploadFileTask = (req, res, next)=> {


   const taskID = req.taskID;
   const folderPath = req.folderPath;

//    pool.query(`DELETE FROM task_${spaceID} WHERE task_id = ?`,[taskID],(error,result,fields)=>{
//       if (error) {
//          console.log(error);
//          next(AppError.create(error, 500, "database Error"));
//          return;
//       }
//       // console.log("result delete space...", result);
//       RESPONSE.successHandler(res, 200, {
//          delete: true
//       });
//    }
// );

      RESPONSE.successHandler(res, 200, {
         taskID,
         folderPath
      });

}



module.exports = {
   getAllTags,
   create,
   getAllTask,
   deleteTask,
   getTask,
   update,
   uploadFileTask
}
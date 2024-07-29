const pool = require('../model/db');
const AppError = require('../util/customError');
const {deleteFolderRecursive} = require('../controller/projectController');
const path = require('node:path');


const deleteSpaceProject = async (spaceID,req,next)=> {

   pool.query(`SELECT project_id FROM project WHERE space_id = ? `,[spaceID],(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
   } 

   if(result.length > 0)
   result.map(item=>{
      
      let projectID = item.project_id;

      pool.query(`DROP TABLE project_file_${projectID}`,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
   
         pool.query(`DROP TABLE project_folder_${projectID}`,(error,result,fields)=>{
            if (error) {
               console.log("database Error",error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
   
         pool.query(`DELETE FROM project WHERE project_id = ? `,[projectID],(error,result,fields)=>{
            if (error) {
               console.log("database Error",error);
               next(AppError.create(error, 500, "database Error"));
               return;
         }
   
         const folderPath = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,'project',`${projectID}`);
   
         deleteFolderRecursive(folderPath)
         .then(() => console.log('Folder deletion completed.'))
         .catch((err) => console.error('Error deleting folder:', err));

            // RESPONSE.successHandler(res, 200, {
            //    projectID
            // });
            return true;
      });
   
      
      });
       
   });

   })

}
)

}




const deleteSpaceTask = async(spaceID,next)=>{

      pool.query(`DROP TABLE task_tag_${spaceID}`,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         pool.query(`DROP TABLE task_${spaceID}`,(error,result,fields)=>{
            if (error) {
               console.log("database Error",error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            return;

         })
   
      })

}


const deleteSpaceChat = async(spaceID,next)=>{

   pool.query(`DROP TABLE space_message_${spaceID}`,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      return;
   })

}


module.exports = {deleteSpaceProject,deleteSpaceTask,deleteSpaceChat};
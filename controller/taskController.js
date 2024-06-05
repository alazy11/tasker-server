const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');
const {validationResult} = require('express-validator');




const create = (req, res, next)=> {

   const {projectID,spaceID,title,state,manager,priority,selectedTags,phases,startDate,endDate,desc} = req.body;
   let tasktag = [];
   const task = [phases,projectID,manager,title,desc,startDate,endDate,link,state,priority];



   pool.query(`INSERT INTO task_${spaceID} 
      
      phase_id = ?,
      project_id = ?, 
      employee_id = ?,
      title = ?,
      description = ?,
      start_date = ?,
      end_date = ?,
      state = ?,
      priority = ?,

   `,task,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      if(selectedTags.length > 0) {
      try{

         selectedTags?.forEach(element => {
            tasktag.push([result.task_id,element])
         });
   
      } catch(err) {
         console.log("dikjbhfd",err)
      }

      pool.query(`INSERT INTO task_tag_${spaceID} 
      
         task_id = ?,
         tag_name = ?,
   
      `,(error,result,fields)=>{
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




const getAllTags = (req, res, next)=> {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   const projectID = searchParams.projectID;
   
   pool.query(`SELECT task_tag_${spaceID}.tag_name FROM task_tag_${spaceID} INNER JOIN task_${spaceID} ON task_tag_${spaceID}.task_id = ANY (SELECT task_id FROM task_${spaceID} WHERE project_id = ?)`,[projectID],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      console.log("result tags === ...", result);
      RESPONSE.successHandler(res, 200, {
         ...result
      });
   }
);
}



module.exports = {
   getAllTags,
   create
}
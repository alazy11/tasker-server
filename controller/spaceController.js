const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');
const {validationResult} = require('express-validator');


const setMemberInSpace = (req,res,next)=>{

   let {
      memberID,
      spaceID
   } = req.body;

   // memberID.shift();

   let member = [];
   memberID.forEach(element => {
      member.push([spaceID,element.employee_id]);
   });

   pool.query('INSERT INTO space_members (space_id, employee_id) VALUES ?',[member],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
      }
      console.log("result...", result);
      if(!req.response) {
         return;
      }
      RESPONSE.successHandler(res, 200, {
         member : result
      });
   }
);
}




const createTask = (req, res, next,spaceID)=>{


   pool.query(`CREATE TABLE task_${spaceID} (
      
      task_id int AUTO_INCREMENT,
      phase_id int,
      project_id varchar(200) NOT NULL, 
      employee_id int,
      title varchar(100) NOT NULL,
      description varchar(3000) NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      link BOOLEAN DEFAULT false,
      state varchar(20) NOT NULL DEFAULT "todo",
      priority varchar(20) NOT NULL DEFAULT "normal",

      PRIMARY KEY (task_id),
      FOREIGN KEY (phase_id) REFERENCES plan_phase(phase_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON UPDATE CASCADE,

   )`,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }


      pool.query(`CREATE TABLE task_tag_${spaceID} (
      
         task_id int NOT NULL,
         tag_name varchar(100) NOT NULL,
   
         PRIMARY KEY (task_id),
         FOREIGN KEY (task_id) REFERENCES task_${spaceID}(task_id) ON UPDATE CASCADE ON DELETE CASCADE,
   
      )`,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         
         RESPONSE.successHandler(res, 200, {
            msg : 'ok created'
         });
   
      })

      
      // RESPONSE.successHandler(res, 200, {
      //    ...project
      // });

   })

}





const create = (req, res, next) => {
   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let {
      company_id,
      title,
      description,
      icon,
      textIcon,
      pathIconSpace,
      selectColor,
      memberID
   } = req.body;

   req.response = false;

   const spaceID = company_id + require('crypto').randomBytes(5).toString('hex');

   req.body.spaceID = spaceID;

   setMemberInSpace(req,res,next);

   // hash(password, 10, (err, hash) => {
      const space = [
         spaceID,
         company_id,
         title,
         description,
         icon,
         textIcon,
         pathIconSpace,
         selectColor
      ];

      pool.query('INSERT INTO space SET space_id = ?,company_id = ?,title = ?,description = ?,icon = ?,icon_text = ?,icon_path = ?,color = ?',space,(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }

            createTask(req, res, next,spaceID);
            // RESPONSE.successHandler(res, 200, {
            //    ...space
            // });
         }
      );
   // });
}

const getAllSpaces = (req, res, next) => {

   const user = req.user;
   const searchParams = req.query;
   // const page = parseInt(searchParams.page);
   const page = searchParams.page;
   // const recordNumber = parseInt(searchParams.recordNumber);
   const recordNumber = searchParams.recordNumber;

   const offset = (page - 1) * recordNumber;

   pool.query(
      `SELECT * FROM space WHERE company_id = ? LIMIT ${recordNumber} OFFSET ${offset}`,
      [user.id],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result....', result);
   
         // Execute the count query separately
         pool.query(
            `SELECT COUNT(*) AS count FROM space WHERE company_id = ?`,
            [user.id],
            (countError, countResult) => {
               if (countError) {
                  console.log("count error", countError);
                  next(AppError.create(countError, 500, "database Error"));
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




const getSpace = (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;

   pool.query(
      `SELECT * FROM space WHERE space_id = ?`,
      [searchParams],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log('space result....', result);
         RESPONSE.successHandler(res, 200, {
            ...result[0]
         });
      }
   );
}

const updateSpace = (req, res, next) => {

   const user = req.user;

   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let {
      spaceID,
      company_id,
      title,
      description,
      icon,
      textIcon,
      pathIconSpace,
      selectColor
   } = req.body;

      const space = [
         spaceID,
         company_id,
         title,
         description,
         icon,
         textIcon,
         pathIconSpace,
         selectColor
      ];

      pool.query('UPDATE space SET space_id = ?,company_id = ?,title = ?,description = ?,icon = ?,icon_text = ?,icon_path = ?,color = ? WHERE space_id = ?',[...space,spaceID],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               ...space
            });
         }
      );
}


const setSpaceInArchive = (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;
   
      pool.query('UPDATE space SET archived = ? WHERE space_id = ?',[true,searchParams],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               archive: true
            });
         }
      );
}


const searchMember = (req, res, next)=>{

   let user = req.query.member;
   let space_id = req.query.spaceID;

    pool.query(
      //`SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ?) LIMIT ${recordNumber} OFFSET ${offset} `,
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ?) AND user.public_name LIKE ?`,
      [space_id,`%${user}%`],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log('space result....', result);

         RESPONSE.successHandler(res, 200, {
            ...result
         });

      }
   );
}


const deleteSpace = (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;
   
      pool.query('DELETE FROM space WHERE space_id = ?',[searchParams],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               delete: true
            });
         }
      );
}

const deleteMember = (req, res, next)=>{

   let memberID = req.query.employeeID;
   let spaceID = req.query.spaceID;

   // memberID.shift();

   // let member = [];
   // memberID.forEach(element => {
   //    member.push([spaceID,element.employee_id]);
   // });

   pool.query('DELETE FROM space_members WHERE space_id = ? AND employee_id = ?',[spaceID,memberID],(error,result,fields)=>{
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
      }
      RESPONSE.successHandler(res, 200, {
         member : result
      });
   }
);

}


const getAllMembersSpace = (req, res, next)=> {

   const user = req.user;
   const spaceID = req.params.spaceID;
   const searchParams = req.query;
   // const page = parseInt(searchParams.page);
   const page = searchParams.page;
   // const recordNumber = parseInt(searchParams.recordNumber);
   const recordNumber = searchParams.recordNumber;

   const offset = (page - 1) * recordNumber;

   pool.query(
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ?) LIMIT ${recordNumber} OFFSET ${offset} `,
      [spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log('space result all members....', result);
   
         // Execute the count query separately
         pool.query(
            `SELECT COUNT(*) AS count FROM employee WHERE company_id = ?`,
            [user.id],
            (countError, countResult) => {
               if (countError) {
                  console.log("count error", countError);
                  next(AppError.create(countError, 500, "database Error"));
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


module.exports ={
   create,
   getAllSpaces,
   getSpace,
   updateSpace,
   setSpaceInArchive,
   deleteSpace,
   getAllMembersSpace,
   setMemberInSpace,
   deleteMember,
   searchMember
}
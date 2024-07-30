const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');
const {validationResult} = require('express-validator');
const {deleteSpaceProject,deleteSpaceTask,deleteSpaceChat} = require('../util/deleteSpaceProject');
const fs = require('node:fs');
const path = require('node:path');
const getUser = require('../util/chatSpace/getUser');
const getCompany = require('../util/chatSpace/getCompany');
const {v4} = require('uuid');

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
      
      task_id varchar(50),
      project_id varchar(200) NOT NULL REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE, 
      user_id int,
      folder_path varchar(2000),
      download_folder_path varchar(2000),
      title varchar(100) NOT NULL,
      description varchar(3000) NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      state varchar(20) NOT NULL DEFAULT "todo",
      priority varchar(20) NOT NULL DEFAULT "normal",
      

      PRIMARY KEY (task_id),
      FOREIGN KEY (user_id) REFERENCES user(user_id) ON UPDATE CASCADE

   )`,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`CREATE TABLE pull_request_${spaceID}(
         pull_id varchar(50),
         pull_date DATE,
         description varchar(5000),
         task_id varchar(50),	
         project_id varchar(200) NOT NULL REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE, 
         employee_id int,
         is_accepted BOOLEAN DEFAULT false,

      PRIMARY KEY (pull_id),
      FOREIGN KEY (task_id) REFERENCES task_${spaceID}(task_id) ON UPDATE CASCADE ON DELETE CASCADE
         )
         `,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
      })


      pool.query(`CREATE TABLE task_tag_${spaceID} (
      
         task_id varchar(50) NOT NULL,
         tag_name varchar(100) NOT NULL,
   
         FOREIGN KEY (task_id) REFERENCES task_${spaceID}(task_id) ON UPDATE CASCADE ON DELETE CASCADE
   
      )`,(error,result,fields)=>{
         if (error) {
            console.log("database Error",error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         
         return;
         // RESPONSE.successHandler(res, 200, {
         //    msg : 'ok created'
         // });
   
      })

      
      // RESPONSE.successHandler(res, 200, {
      //    ...project
      // });

   })

}

const createChat = (req, res, next,spaceID)=>{
   // ms_id	room_id	employee_id	send_date	ms_type	conten

   pool.query(`CREATE TABLE space_message_${spaceID} (
      
      ms_id int AUTO_INCREMENT,
      room_id varchar(100), 
      user_id int,
      company_id int,
      send_date DATE NOT NULL,
      send_time varchar(50) NOT NULL,
      ms_type varchar(50) NOT NULL DEFAULT "text",
      conten varchar(3000) NOT NULL,
      size varchar(30),
      name varchar(100),

      PRIMARY KEY (ms_id),
      FOREIGN KEY (user_id) REFERENCES user(user_id) ON UPDATE CASCADE,
      FOREIGN KEY (company_id) REFERENCES company(company_id) ON UPDATE CASCADE

   )`,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      return;
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
   const roomID = spaceID + require('crypto').randomBytes(5).toString('hex');
   const folderPathChat = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,`chat`);
   const folderPathProject = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,`project`);
   // const folderPathTask= path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`,`space`,`${spaceID}`,`task`);

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
         selectColor,
         roomID
      ];

      pool.query('INSERT INTO space SET space_id = ?,company_id = ?,title = ?,description = ?,icon = ?,icon_text = ?,icon_path = ?,color = ?,room_id = ?',space,(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }

            pool.query('INSERT INTO space_manager_role SET space_id = ?',[spaceID],(error,result,fields)=>{
               if (error) {
                  console.log(error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }

               createTask(req, res, next,spaceID);
               createChat(req, res, next,spaceID);
   
               fs.mkdir(folderPathChat,{ recursive: true },(err)=>{
                  console.log('folder error ...',err)
               });
               fs.mkdir(folderPathProject,{ recursive: true },(err)=>{
                  console.log('folder error ...',err)
               });

   
               RESPONSE.successHandler(res, 200, {
                  ...space
               });

            }
         );

         }
      );
   // });
}

const renameSpace = (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;
   const {name} = req.body;

   pool.query(
      `UPDATE space SET title = ?  WHERE space_id = ?`,
      [name,searchParams],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result....', result);
         RESPONSE.successHandler(res, 200,"rename space successfully.");
      }
   );
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
         // console.log('space result....', result);
         RESPONSE.successHandler(res, 200, {
            ...result[0]
         });
      }
   );
}

const getRoomIdForSpace = (req, res, next) => {

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
            // console.log("result...", result);
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
            // console.log("result...", result);
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
         // console.log('space result....', result);

         RESPONSE.successHandler(res, 200, {
            ...result
         });

      }
   );
}


const deleteSpace = async (req, res, next) => {

   const user = req.user;
   const searchParams = req.params.spaceID;
   
   await deleteSpaceProject(searchParams,req,next);
   await deleteSpaceTask(searchParams,next);
   await deleteSpaceChat(searchParams,next);

      pool.query('DELETE FROM space WHERE space_id = ?',[searchParams],(error,result,fields)=>{
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


const assignManager = async (req, res, next) => {

   const user = req.user;
   // const manager = req.body;
   const {employee_id} = req.body;
   const spaceID = req.params.spaceID;
   
      pool.query('UPDATE space SET manager = ? WHERE space_id = ?',[employee_id,spaceID],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
            // console.log("result delete space...", result);
   
            pool.query('UPDATE space_manager_role SET employee_id = ? WHERE space_id = ?',[employee_id,spaceID],(error,result,fields)=>{
               if (error) {
                  console.log(error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
               // console.log("result delete space...", result);
               RESPONSE.successHandler(res, 200, {
                  assign: "assign manager successfully."
               });
   
            }
         );

         }
      );
}


const roleManager = async (req, res, next) => {

   const user = req.user;
   const spaceID = req.params.spaceID;

   const {
      rename_space,
      space_description,
      space_icon,
      add_member,
      remove_member,
      add_project,
      remove_project,
      edit_project,
      setting_project,
      block_user,
      lock_user,
      lock_chat,
      remove_post,
      prevent_post,
      lock_post,
      number_post,
      remove_poll,
      prevent_poll,
      lock_poll,
      number_poll,
      assign_task,
      remove_task,
      edit_task,
      setting_task
      } = req.body;

      let role = [
         rename_space,
         space_description,
         space_icon,
         add_member,
         remove_member,
         add_project,
         remove_project,
         edit_project,
         setting_project,
         block_user,
         lock_user,
         lock_chat,
         remove_post,
         prevent_post,
         lock_post,
         number_post,
         remove_poll,
         prevent_poll,
         lock_poll,
         number_poll,
         assign_task,
         remove_task,
         edit_task,
         setting_task
      ]
   
      pool.query(`UPDATE space_manager_role SET
         
      rename_space = ?,
      space_description = ?,
      space_icon = ?,
      add_member = ?,
      remove_member = ?,
      add_project = ?,
      remove_project = ?,
      edit_project = ?,
      setting_project = ?,
      block_user = ?,
      lock_user = ?,
      lock_chat = ?,
      remove_post = ?,
      prevent_post = ?,
      lock_post = ?,
      number_post = ?,
      remove_poll = ?,
      prevent_poll = ?,
      lock_poll = ?,
      number_poll = ?,
      assign_task = ?,
      remove_task = ?,
      edit_task = ?,
      setting_task = ?

         WHERE space_id = ?`,[...role,spaceID],(error,result,fields)=>{
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         // console.log("result delete space...", result);
         RESPONSE.successHandler(res, 200, {
            assign: "assign manager successfully."
         });

      }
   );

}


const setRoleManager = async (req, res, next) => {

   const user = req.user;
   const spaceID = req.params.spaceID;
   
      pool.query(`SELECT * FROM space_manager_role WHERE space_id = ?`,[spaceID],(error,result,fields)=>{
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         console.log("result delete space...", result);


         result = result.map(item=>{
            return {
space_id:item.space_id,
employee_id:item.employee_id,
rename_space:Boolean(item.rename_space),
space_description:Boolean(item.space_description),
space_icon:Boolean(item.space_icon),
add_member:Boolean(item.add_member),
remove_member:Boolean(item.remove_member),
add_project:Boolean(item.add_project),
remove_project:Boolean(item.remove_project),
edit_project:Boolean(item.edit_project),
setting_project:Boolean(item.setting_project),
block_user:Boolean(item.block_user),
lock_user:Boolean(item.lock_user),
lock_chat:Boolean(item.lock_chat),
remove_post:Boolean(item.remove_post),
prevent_post:Boolean(item.prevent_post),
lock_post:Boolean(item.lock_post),
number_post:Boolean(item.number_post),
remove_poll:Boolean(item.remove_poll),
prevent_poll:Boolean(item.prevent_poll),
lock_poll:Boolean(item.lock_poll),
number_poll:Boolean(item.number_poll),
assign_task:Boolean(item.assign_task),
remove_task:Boolean(item.remove_task),
edit_task:Boolean(item.edit_task),
setting_task:Boolean(item.setting_task)
            }

         })

         RESPONSE.successHandler(res, 200, {
            ...result[0]
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


const getUserSpaces = (req, res, next)=>{

   console.log('user - spaces - id',req.user)

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
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email, user.room_ID FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ?) LIMIT ${recordNumber} OFFSET ${offset} `,
      [spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log('space result all members....', result);
   
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
      `SELECT ms_id, room_id, user_id, company_id, send_date, send_time, ms_type, conten, size, name FROM space_message_${spaceID} ORDER BY ms_id DESC LIMIT ${recordNumber} OFFSET ${offset}`,
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
   const filePath = req.query.filePath;

   console.log("messageType",messageType)
   
   if(messageType !== 'text') {


      fs.unlink(filePath, (err) => {
         if (err) {
           console.log('Error renaming file:', err);
           next(AppError.create(err, 500, "file delete error"));
           return;
         } else {
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
       
       });


   } else {
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

const setting = (req, res, next)=>{

   let process = req.query.process;
   let spaceID = req.params.spaceID;

   if(process === 'lock') {
      let isLock = req.query.isLock;
      console.log("process",process)
      console.log("isLock",isLock)
      console.log("isLock",isLock == true)

      isLock = isLock == "true" ? true : false;

      pool.query(
         `UPDATE space SET isLocked = ? WHERE space_id = ?`,[isLock,spaceID],
         (error, result, fields) => {
            if (error) {
               console.log("sql error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
   
            RESPONSE.successHandler(res, 200, {
               message:'locked successfully.'
            });
   
         }
      )
   }

}

const blockChatUser = (req, res, next)=>{

   let user = req.params.userID;
   // let employee_id = req.params.userID;
   let spaceID = req.params.spaceID;
   let isBlocked = req.query.isBlocked;


   console.log("user user",user)
   console.log("isBlocked",isBlocked)

   isBlocked = isBlocked === 'true' ? true : false;

   pool.query(
      `UPDATE space_members SET is_blocked = ? WHERE employee_id = ?`,[isBlocked,user],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            message:'blocked successfully.'
         });

      }
   )

}

const getBlockList = (req, res, next)=>{

   const spaceID = req.params.spaceID;

   pool.query(
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.room_ID FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ? AND is_blocked = 1 )`,[spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         pool.query(
            `SELECT COUNT(*) AS count FROM space_members WHERE space_id = ? AND is_blocked = 1`,[spaceID],
            (error, result1, fields) => {
               if (error) {
                  console.log("sql error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
      
               RESPONSE.successHandler(res, 200, {
                  members: result,
                  total: result1[0].count
               });
      
            }
         )

      }
   )

}


const lockChatUser = (req, res, next)=>{

   let user = req.params.userID;
   let spaceID = req.params.spaceID;
   let isLocked = req.query.isLocked;


   console.log("user user",user)
   // console.log("isBlocked",isBlocked)

   isLocked = isLocked === 'true' ? true : false;

   pool.query(
      `UPDATE space_members SET is_locked = ? WHERE employee_id = ?`,[isLocked,user],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            message:'locked successfully.'
         });

      }
   )

}


const getLockList = (req, res, next)=>{

   const spaceID = req.params.spaceID;

   pool.query(
      `SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.room_ID FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM space_members WHERE space_id = ? AND is_locked = 1 )`,[spaceID],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         pool.query(
            `SELECT COUNT(*) AS count FROM space_members WHERE space_id = ? AND is_locked = 1`,[spaceID],
            (error, result1, fields) => {
               if (error) {
                  console.log("sql error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
      
               RESPONSE.successHandler(res, 200, {
                  members: result,
                  total: result1[0].count
               });
      
            }
         )

      }
   )

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



const updateMeeting = (req, res, next)=>{

   const {active} = req.body;
   const meetId = req.params.meetId;


   pool.query(
      `UPDATE meeting SET is_active = ? WHERE meet_id = ?`,[active,meetId],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            message:'space has been active'
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
               message:true
            });

         } else {

            RESPONSE.successHandler(res, 200, {
               message:false
            });

         }
      }
   )
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
   assignManager,
   deleteMember,
   searchMember,
   getUserSpaces,
   uploadSpaceFileChat,
   getSpaceMessage,
   deleteSpaceMessage,
   downloadFile,
   setting,
   blockChatUser,
   getBlockList,
   lockChatUser,
   getLockList,
   roleManager,
   setRoleManager,
   setMeeting,
   isValidMeeting,
   updateMeeting,
   renameSpace
}
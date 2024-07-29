const RESPONSE = require("../handlers/errorHandler");
const pool = require("../model/db");
const createToken = require("../util/creatToken");
const { hash, compare } = require("bcrypt");
const AppError = require("../util/customError");
const { validationResult, Result } = require("express-validator");
const {addEmployee} = require('./companyController');
const AdmZip = require("adm-zip");
const fs = require('node:fs');
const gatEmployee = require('../util/gatEmployee');

const create = (req, res, next) => {
   const result = validationResult(req);
   if (!result.isEmpty()) {
      return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   }
   let {
      userName,
      name,
      phone,
      email,
      password,
      job,
      gender,
      birthDate,
      country,
   } = req.body;
   const roomId = userName + require('crypto').randomBytes(5).toString('hex');
   hash(password, 10, (err, hash) => {
      if (err) RESPONSE.errorHandler(res, 500, "something wrong!");
      const user = [
         userName,
         name,
         phone,
         email,
         job,
         hash,
         birthDate,
         gender,
         country,
         roomId
      ];
      pool.query(
         "INSERT INTO user SET user_name = ?,public_name = ?,phone_number = ?,email = ?,job = ?,user_password = ?,birth_date = ?,gender = ?,country = ?,room_ID = ?",
         user,
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            const token = createToken({
               id: result.insertId,
               userName: userName,
               email: email,
            });
            res.cookie("token", token, {
               secure: true,
               httpOnly: true,
               sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
               // domain: process.env.DOMAIN,
               path: "/en/user",
               maxAge: 1200000,
            });

            res.cookie("roomId", roomId, {
               // secure: true,
               // httpOnly: true,
               sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
               // domain: process.env.DOMAIN,
               path: "/en/user",
               maxAge: 3600000,
            });

            res.cookie("type", 'user', {
               // secure: true,
               // httpOnly: true,
               sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
               // domain: process.env.DOMAIN,
               path: "/en/user",
               maxAge: 3600000,
            });

            RESPONSE.successHandler(res, 200, {
               user: userName,
               token: res.getHeader("Set-Cookie"),
            });
         }
      );
   });
};

const searchByUserNameAndEmail = (req, res, next) => {
   let userName, email;
   console.log(req.query.userName);
   if (req.query.userName) {
      ({ userName } = req.query);

      pool.query(
         "SELECT user_name FROM user WHERE user_name = ? ",
         [userName],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log(result);
            if (result.length !== 0) {
               RESPONSE.failHandler(res, 500, {
                  userName: "this User name has already exist!",
               });
            } else {
               RESPONSE.successHandler(res, 200, {
                  userName: "this User name correct",
               });
            }
         }
      );
   } else {
      ({ email } = req.query);

      pool.query(
         "SELECT email FROM user WHERE email = ? ",
         [email],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log(result);
            if (result.length !== 0) {
               RESPONSE.failHandler(res, 500, {
                  email: "this email has already exist!",
               });
            } else {
               RESPONSE.successHandler(res, 200, {
                  email: "this email correct",
               });
            }
         }
      );
   }
};

const login = (req, res, next) => {
   // const result = validationResult(req);
   // if (!result.isEmpty()) {
   //    return RESPONSE.errorHandler(res, 500, result.array()[0]["msg"]);
   // }
   let { userName, password } = req.body;

   console.log("some one log in")

   pool.query(
      "SELECT user_id,user_name,user_password,room_ID FROM user WHERE user_name = ?",
      userName,
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         if (result.length > 0) {
            console.log(result)
            compare(password, result[0]["user_password"], (err, resul) => {
               console.log('result com...',result)
               if (err){
                  console.log('compar...',err);
                  next(AppError.create(error, 500, "database Error"));
               } 
               if (resul) {
                  console.log(resul);
                  const token = createToken({
                     id: result[0]["user_id"],
                     userName: result[0]["user_name"],
                  });
                  res.cookie("token", token, {
                     secure: false,
                     httpOnly: true,
                     sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                     // domain: process.env.DOMAIN,
                     path: "/en/user",
                     maxAge: 3600000,
                  });

                  res.cookie("roomId", result[0]["room_ID"], {
                     // secure: true,
                     // httpOnly: true,
                     sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                     // domain: process.env.DOMAIN,
                     path: "/en/user",
                     maxAge: 3600000,
                  });

                  res.cookie("type", 'user', {
                     // secure: true,
                     // httpOnly: true,
                     sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
                     // domain: process.env.DOMAIN,
                     path: "/en/user",
                     maxAge: 3600000,
                  });

                  RESPONSE.successHandler(res, 200, {
                     id: result[0]["user_id"],
                     userName: result[0]["user_name"],
                  });
                  return;
               }
               RESPONSE.errorHandler(res, 401, 
                  'the password is not correct'
               );
            });
         } else {
               RESPONSE.errorHandler(res, 500, 
               'the user name is not exists'
               );
         }

      }
   );
};


const getUser = (req, res, next)=>{
   // console.log('user',req.user);
   
   pool.query(
      "SELECT * FROM user WHERE user_name = ? ",
      [req.user.userName],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         // console.log(result);
         if (result.length > 0) {
            RESPONSE.successHandler(res, 200, {
               ...result[0]
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );

}




const gettask = async (req,spaceID,title)=>{

   return new Promise((resolve,reject)=>{
   // pool.query(`SELECT * FROM task_${spaceID}  WHERE user_id = ? GROUP BY state `,[req.user.id],(error,result,fields)=>{
   // pool.query(`SELECT * FROM task_${spaceID}  WHERE user_id = ? `,[req.user.id],(error,result,fields)=>{
      pool.query(`SELECT task_${spaceID}.task_id,task_${spaceID}.download_folder_path, project.title as project,task_${spaceID}.project_id ,task_${spaceID}.title ,task_${spaceID}.description ,task_${spaceID}.state ,task_${spaceID}.priority, task_${spaceID}.start_date, task_${spaceID}.end_date FROM task_${spaceID} INNER JOIN project ON (task_${spaceID}.project_id = project.project_id) WHERE task_${spaceID}.user_id = ? `,[req.user.id],(error,result,fields)=>{
      if (error) {
         console.log(error);
         // next(AppError.create(error, 500, "database Error"));
         reject(error)
         return;
      }

      result.forEach(element => {
         element.space = title;
         element.spaceID = spaceID;
      });

      resolve(result)

   }

);
})

}



const getAllTasks = (req, res, next)=>{
   // console.log('user',req.user);

   pool.query(
      `SELECT space.space_id,space.title FROM space_members INNER JOIN space USING(space_id) WHERE space_members.employee_id IN(SELECT employee_id FROM employee WHERE user_id = ?)`,
      [req.user.id],
      async (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         let element = [];
         for (let index = 0; index < result.length; index++) {
            element[index] = await gettask(req,result[index].space_id,result[index].title);
         }
         RESPONSE.successHandler(res, 200, element.flat());
      }
   );

}

const downloadTaskFile = (req, res, next)=>{

   let {folder_path,name} = JSON.parse(req.query.folder);
   console.log(req.query.folder)

   const folderPath = folder_path + '\\' + `${name}.zip`;
   const folderName = `${name}.zip`;

   try {
      const zip = new AdmZip();
      const outputFile = folderPath;
      zip.addLocalFolder(folder_path);
      zip.writeZip(outputFile);
      console.log(`Created ${outputFile} successfully`);

      res.download(folderPath,folderName, (err) => {
         if (err) {
           console.error('Error downloading file:', err);
           fs.unlinkSync(folderPath);
         } else {
           console.log('File downloaded successfully!');
           fs.unlinkSync(folderPath);
         }
      });

    } catch (error) {
      console.log(`Something went wrong. ${error}`);
      next(AppError.create(error, 500, "zip Error"));
    }

}

const searchUser = (req, res, next)=>{
   // console.log('user',req.user);
   let user = req.query.user;
   pool.query(
      "SELECT * FROM user WHERE user_name = ? ",
      [user],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if (result.length > 0) {
            RESPONSE.successHandler(res, 200, {
               ...result[0]
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );

}



const getUserInformation = (req, res, next)=>{
   // console.log('user',req.user);
   let type = req.query.type;
   let user = req.query.user;

   console.log("user name/ / // / ///",user);
   console.log("user type/ / // / ///",type);

   if(type === 'user')
   pool.query(
      "SELECT * FROM user WHERE room_ID = ? ",
      [user],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         console.log(result);
         if (result?.length > 0) {
            RESPONSE.successHandler(res, 200, {
               ...result[0]
            });
         } else {
            RESPONSE.failHandler(res, 500, {
               email: "this user not exist!",
            });
         }
      }
   );
   else
      pool.query(
         "SELECT * FROM company WHERE room_ID = ? ",
         [user],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            console.log(result);
            if (result?.length > 0) {
               RESPONSE.successHandler(res, 200, {
                  ...result[0]
               });
            } else {
               RESPONSE.failHandler(res, 500, {
                  email: "this user not exist!",
               });
            }
         }
      );

}



const gatAllOrderJoin = (req, res, next)=>{
   // console.log('user alazy',req.user);

   pool.query(
      // "SELECT * FROM join_orders WHERE user_id = ?",
      "SELECT join_orders.company_id,join_orders.company_name,join_orders.job,join_orders.user_id,company.room_ID,company.profile_path FROM join_orders INNER JOIN company USING(company_id) WHERE join_orders.user_id = ?",
      [req.user.id],
      (error, result, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
         }
         RESPONSE.successHandler(res, 200, {
            ...result
         });
      }
   );

}

const acceptOrder = (req, res, next)=>{
   addEmployee(req,res,next);
}

const deleteOrder = (req, res, next)=>{

   let company = req.query.company_id;

   // console.log("company",company)
   // company_id = parseInt(company_id);
   
   pool.query(
      "DELETE FROM join_orders WHERE user_id = ? AND company_id = ?",
      [req.user.id,company],
      (error, result, fields) => {
         if (error) {
            console.log("delete join error >>>",error);
            next(AppError.create(error, 500, "database Error"));
         }

         RESPONSE.successHandler(res, 200, {
            message: "Order has been deleted."
         });
      }
   );

}


const isThereMeeting = (req, res, next)=> {

   let user = req.user.id;

   pool.query(
      `SELECT space.space_id,space.title FROM space_members INNER JOIN space USING(space_id) WHERE space_members.employee_id IN(SELECT employee_id FROM employee WHERE user_id = ?)`,
      [req.user.id],
      (error, result, fields) => {
         if (error) {
            console.log("sql error", error);
            next(AppError.create(error, 500, "database Error"));
         }

         if(result.length > 0) {

            let spaces = result.map(item=>{
               return item.space_id;
            })
            result = result.map(item=>{
               return [item.space_id,item.title];
            });

            let set = new Map(result);

            // console.log("spacesspaces",spaces);

            pool.query(
               `SELECT * FROM meeting WHERE space_id IN ('${spaces.join(`','`)}')`,
               (error, result1, fields) => {
                  if (error) {
                     console.log("sql error", error);
                     // reject(error)
                     next(AppError.create(error, 500, "database Error"));
                     return;
                  }
                  // console.log("meetsmeets",result1.query);

                  if(result1.length > 0) {

                     let meets = result1.map(item=>{

                        return {
                           ...item,
                           title:set.get(item.space_id)
                        }

                     })

                     RESPONSE.successHandler(res, 200,meets);

                  } else {
                     RESPONSE.successHandler(res, 200,[]);
                  }
               }
            )

         } else {

            RESPONSE.successHandler(res, 200, []);

         }

      }
   );

}

const pullRequest = async(req, res, next) => {

   const {selectedFile,pullDate,employeeID,pullID,description,taskID} = req.body;

   const {projectID,spaceID} = req.params;
   const employee_id = await gatEmployee(req.user.id);

   const pull = [pullID,pullDate,description,taskID,projectID,employee_id]


   console.log(selectedFile)
   console.log(pullDate)
   console.log(employeeID)
   console.log(pullID)
   console.log(description)
   console.log(taskID)
   // let file = [req.files[0].path,taskID,projectID,employeeID,req.files[0].filename,req.files[0].mimetype,uploadDate,req.files[0].size,folderID]
   pool.query(`INSERT INTO pull_request_${spaceID} SET
      pull_id = ?,
      pull_date = ?,
      description = ?,
      task_id = ?,	
      project_id = ?,
      employee_id = ?
      `,pull,(error,result,fields)=>{
      if (error) {
         console.log("database Error",error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
   
      selectedFile.forEach(item=>{

         let file = [pullID,item.file_path,item.name,item.type,item.upload_date,item.size]

         pool.query(`INSERT INTO project_pull_request_${projectID} SET
            pull_id = ?,
            file_path = ?,
            name = ?,
            type = ?,	
            upload_date = ?,
            size = ?
            `,file,(error,result,fields)=>{
            if (error) {
               console.log("database Error",error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
         })
      })

      RESPONSE.successHandler(res, 200, {
         ms:'ok'
      });
   
   })


}


const uploadFileTask = (req, res, next)=> {

   const taskID = req.taskID;
   const folderPath = req.folderPath;
      RESPONSE.successHandler(res, 200, {
         taskID,
         folderPath
      });

}

const createNote = (req, res, next) => {

   const user = req.user;
   const {desc,date,title} = req.body;

   
      pool.query('INSERT INTO user_note SET content = ?,	upload_date = ?,	user_id = ?, title = ?',[desc,date,user.id,title],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               message: "created ok"
            });
         }
      );
}

const getAllNote = (req, res, next) => {

   const user = req.user;
   
      pool.query('SELECT * FROM user_note WHERE	user_id = ?',[user.id],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, result);
         }
      );
}

const editNote = (req, res, next) => {

   const user = req.user;
   const {desc,date,title,note_id} = req.body;

   
      pool.query('UPDATE user_note SET content = ?, upload_date = ?,	user_id = ?, title = ? WHERE note_id = ?',[desc,date,user.id,title,note_id],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               message: "edited ok"
            });
         }
      );
}


const deleteNote = (req, res, next) => {

   const user = req.user;
   const {note_id} = req.query;

   
      pool.query('DELETE FROM user_note WHERE note_id = ?',[note_id],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               message: "deleted ok"
            });
         }
      );
}


const uploadClip = (req, res, next)=> {

   const folderPath = req.folderPath;
   const fileName = req.fileName;
      RESPONSE.successHandler(res, 200, {
         folderPath,
         fileName
      });

}


const saveClip = (req, res, next) => {

   const user = req.user;
   const {path,date,title} = req.body;

      pool.query('INSERT INTO user_clip SET path = ?,	create_date = ?,	user_id = ?, title = ?',[path,date,user.id,title],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            // console.log("result...", result);
            RESPONSE.successHandler(res, 200, {
               message: "created ok"
            });
         }
      );
}


const getAllClip = (req, res, next) => {

   const user = req.user;

      pool.query('SELECT * FROM user_clip WHERE user_id = ?',[user.id],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            RESPONSE.successHandler(res, 200, result);
         }
      );
}


const getClip = (req, res, next) => {

   const user = req.user;
   const clipID = req.params.clipID;

      pool.query('SELECT * FROM user_clip WHERE clip_id = ?',[clipID],(error,result,fields)=>{
            if (error) {
               console.log(error);
               next(AppError.create(error, 500, "database Error"));
            }
            RESPONSE.successHandler(res, 200, result[0]);
         }
      );
}



module.exports = {
   create,
   searchByUserNameAndEmail,
   login,
   getUser,
   gatAllOrderJoin,
   searchUser,
   acceptOrder,
   deleteOrder,
   getUserInformation,
   isThereMeeting,
   getAllTasks,
   downloadTaskFile,
   uploadFileTask,
   pullRequest,
   createNote,
   getAllNote,
   editNote,
   deleteNote,
   uploadClip,
   saveClip,
   getAllClip,
   getClip
};

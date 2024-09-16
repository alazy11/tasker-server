const RESPONSE = require('../handlers/errorHandler');
const pool = require('../model/db');
const AppError = require('../util/customError');
const { validationResult } = require('express-validator');
const fs = require('node:fs');
const fsp = require('node:fs').promises;
const path = require('node:path');
const AdmZip = require("adm-zip");


const createPathTable = (req, res, next, projectId, project, space_id) => {

   let folderTable = `project_folder_${projectId}`;

   pool.query(`CREATE TABLE project_file_${projectId} (
      
      file_id int AUTO_INCREMENT, 
      file_path varchar(1000) NOT NULL,
      task_id int,
      project_id varchar(200) NOT NULL REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE, 
      employee_id int,
      name varchar(100) NOT NULL,
      type varchar(50) NOT NULL,
      upload_date DATETIME,
      size varchar(30) NOT NULL,
      folder_id int NOT NULL,
      kind varchar(50) DEFAULT 'file',

      PRIMARY KEY (file_id),
      FOREIGN KEY (task_id) REFERENCES task(task_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES ${folderTable}(folder_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON UPDATE CASCADE,
      UNIQUE(file_path)

   )`, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }



      pool.query(`CREATE TABLE project_pull_request_${projectId} (
      
         pull_id varchar(50) NOT NULL REFERENCES pull_request_${space_id}(pull_id) ON UPDATE CASCADE ON DELETE CASCADE,
         file_path varchar(1000) NOT NULL,
         name varchar(100) NOT NULL,
         type varchar(50) NOT NULL,
         upload_date DATETIME,
         size varchar(30) NOT NULL,
         kind varchar(50) DEFAULT 'file',

         UNIQUE(file_path)
   
      )`, (error, result, fields) => {
         if (error) {
            console.log("database Error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            ...project
         });

      })
         ;

   })


}



const createTaskSetting = (req, res, next, projectID) => {

   pool.query(`CREATE TABLE task_setting_${projectID} (
      employee_id int,
      FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE CASCADE
   )`, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`INSERT INTO task_setting_${projectID} (employee_id) SELECT employee_id FROM space_members WHERE pull_request = 0`, (error, result, fields) => {
         if (error) {
            console.log("database Error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         return;
      })

   })

}


const createSetting = (req, res, next, projectID) => {

   pool.query(`CREATE TABLE project_setting_${projectID} (
      employee_id int,
      FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE CASCADE
   )`, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`INSERT INTO project_setting_${projectID} (employee_id) SELECT employee_id FROM space_members WHERE show_project_files = 0`, (error, result, fields) => {
         if (error) {
            console.log("database Error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }
         return;
      })

   })

}



const create = (req, res, next) => {

   const { space_id, title, state, manager, priority, selectedTags, phases, startDate, endDate, desc } = req.body;
   const projectId = space_id + require('crypto').randomBytes(5).toString('hex');
   const project = [projectId, req.user.id, manager, title, desc, state, space_id, priority, phases, startDate, endDate]
   let projectTag = [];
   const folderPath = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`, `space`, `${space_id}`, 'project', `${projectId}`, 'public');
   const folderPathPull = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`, `space`, `${space_id}`, 'project', `${projectId}`, 'pullRequest');
   const folderPathDatabase = path.join('uploads', 'company', `${req.user.id}`, `space`, `${space_id}`, 'project', `${projectId}`, 'public');
   const folderPathTask = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`, `space`, `${space_id}`, 'project', `${projectId}`, `task`);

   try {
      selectedTags?.forEach(element => {
         projectTag.push([projectId, element])
      });

   } catch (err) {
      console.log("dikjbhfd", err)
   }

   pool.query('INSERT INTO project SET project_id = ?,company_id = ?,project_manager = ?,title = ?,description = ?,state = ?,space_id = ?,priority = ?,phase_number = ?, start_date = ?, end_date = ?', project, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      createSetting(req, res, next, projectId);
      createTaskSetting(req, res, next, projectId);

      if (selectedTags.length > 0) {
         pool.query('INSERT INTO project_tag (project_id,tag_name) VALUES ?', [projectTag], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            fs.mkdir(folderPath, { recursive: true }, (err) => {
               console.log('folder error ...', err)
            });
            fs.mkdir(folderPathTask, { recursive: true }, (err) => {
               console.log('folder error ...', err)
            });
            fs.mkdir(folderPathPull, { recursive: true }, (err) => {
               console.log('folder error ...', err)
            });

            pool.query(`CREATE TABLE project_folder_${projectId} (

                  folder_id int AUTO_INCREMENT,
                  project_id varchar(200) NOT NULL REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE,
                  folder_path varchar(2000) NOT NULL,
                  name varchar(200) NOT NULL,
                  create_date DATETIME NOT NULL,
                  parent int,
                  kind varchar(50) DEFAULT 'folder',

                  PRIMARY KEY (folder_id),
                  FOREIGN KEY (parent) REFERENCES project_folder_${projectId}(folder_id) ON UPDATE CASCADE ON DELETE CASCADE,
                  UNIQUE(name)

               )`, (error, result, fields) => {
               if (error) {
                  console.log("database Error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
               let date = new Date();

               pool.query(`INSERT INTO project_folder_${projectId} SET
                     project_id = ?,
                     folder_path = ?,
                     name = ?,
                     create_date = ?
                  `, [projectId, folderPathDatabase, 'public', date], (error, result, fields) => {
                  if (error) {
                     console.log("database Error", error);
                     next(AppError.create(error, 500, "database Error"));
                     return;
                  }
                  createPathTable(req, res, next, projectId, project, space_id);
               })

            })
         }
         );

      } else {

         fs.mkdir(folderPath, { recursive: true }, (err) => {
            console.log('folder error ...', err)
         });

         pool.query(`CREATE TABLE project_folder_${projectId} (

               folder_id int AUTO_INCREMENT,
               project_id varchar(200) NOT NULL REFERENCES project(project_id) ON UPDATE CASCADE ON DELETE CASCADE,
               folder_path varchar(2000) NOT NULL,
               name varchar(200) NOT NULL,
               create_date DATETIME NOT NULL,
               parent int,
               kind varchar(50) DEFAULT 'folder',

               PRIMARY KEY (folder_id),
               FOREIGN KEY (parent) REFERENCES project_folder_${projectId}(folder_id) ON UPDATE CASCADE ON DELETE CASCADE,
               UNIQUE(name)

            )`, (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
            let date = new Date();

            pool.query(`INSERT INTO project_folder_${projectId} SET
                  project_id = ?,
                  folder_path = ?,
                  name = ?,
                  create_date = ?
               `, [projectId, folderPathDatabase, 'public', date], (error, result, fields) => {
               if (error) {
                  console.log("database Error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
               createPathTable(req, res, next, projectId, project, space_id);
            })

         })
      }
   }
   );


}


const AddPhases = (req, res, next) => {

   let { project_id, title, state, startDate, endDate, valueDesc } = req.body;

   let phase = [];

   title.forEach((item, index) => {
      phase.push([item, valueDesc[index], startDate[index], endDate[index], state[index], (index + 1), project_id])
   });

   pool.query(`INSERT INTO plan_phase (title,description,start_date,end_date,state,phase_number,project_id) VALUES ?`, [phase], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`UPDATE project SET assgin_phase = true WHERE project_id = ? `, [project_id], (error, resulte, fields) => {
         if (error) {
            console.log("database Error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         console.log("project result.....", result)
         RESPONSE.successHandler(res, 200, {
            ...result
         });

      });

      // console.log("project result.....",result)
      // RESPONSE.successHandler(res, 200, {
      //       ...result
      // });
   });
}


async function deleteFolderRecursive(folderPath) {
   if (await fsp.access(folderPath).then(() => true).catch(() => false)) {
      const files = await fsp.readdir(folderPath);

      for (const file of files) {
         const currentPath = path.join(folderPath, file);
         const isDirectory = (await fsp.lstat(currentPath)).isDirectory();

         if (isDirectory) {
            // Recursive call for subdirectories
            await deleteFolderRecursive(currentPath);
         } else {
            // Delete file
            await fsp.unlink(currentPath);
         }
      }

      // Delete empty directory
      await fsp.rmdir(folderPath);
      console.log(`Deleted folder: ${folderPath}`);
   }
}



const deleteProject = (req, res, next) => {

   const projectID = req.params.projectID;
   let space_id;

   pool.query(`SELECT space_id FROM project WHERE project_id = ? `, [projectID], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      space_id = result[0].space_id;
   }
   )


   pool.query(`DROP TABLE project_file_${projectID}`, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`DROP TABLE project_folder_${projectID}`, (error, result, fields) => {
         if (error) {
            console.log("database Error", error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         pool.query(`DROP TABLE project_setting_${projectID}`, [projectID], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }
            pool.query(`DROP TABLE project_pull_request_${projectID}`, [projectID], (error, result, fields) => {
               if (error) {
                  console.log("database Error", error);
                  next(AppError.create(error, 500, "database Error"));
                  return;
               }
               pool.query(`DROP TABLE task_setting_${projectID}`, [projectID], (error, result, fields) => {
                  if (error) {
                     console.log("database Error", error);
                     next(AppError.create(error, 500, "database Error"));
                     return;
                  }

                  pool.query(`DELETE FROM project WHERE project_id = ? `, [projectID], (error, result, fields) => {
                     if (error) {
                        console.log("database Error", error);
                        next(AppError.create(error, 500, "database Error"));
                        return;
                     }

                     const folderPath = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`, `space`, `${space_id}`, 'project', `${projectID}`);

                     deleteFolderRecursive(folderPath)
                        .then(() => console.log('Folder deletion completed.'))
                        .catch((err) => console.error('Error deleting folder:', err));

                     console.log("project result.....", result)
                     RESPONSE.successHandler(res, 200, {
                        projectID
                     });

                  });
               });
            });


         });
      });

   });
}



const getAllProjects = (req, res, next) => {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;
   console.log("spaceID", spaceID);
   // const page = parseInt(searchParams.page);
   const page = searchParams.page;
   // const recordNumber = parseInt(searchParams.recordNumber);
   const recordNumber = searchParams.recordNumber;

   const offset = (page - 1) * recordNumber;

   pool.query(`SELECT project.project_id ,user.user_id, user.public_name, user.profile_path ,project.title ,project.description ,project.state ,project.priority,project.phase_number, project.start_date, project.end_date FROM project INNER JOIN user ON (project.project_manager = user.user_id) WHERE project.space_id = ? LIMIT ${recordNumber} OFFSET ${offset}`, [spaceID], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      console.log("project result.....", result)
      pool.query(
         `SELECT COUNT(*) AS count FROM project WHERE space_id = ?`,
         [spaceID],
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

   });

}


const getProject = (req, res, next) => {

   // const searchParams = req.query;
   const projectID = req.params.projectID;

   pool.query(`SELECT project.project_id ,user.user_id, user.public_name, user.profile_path ,project.title, project.assgin_phase, project.description ,project.state ,project.priority,project.phase_number, project.start_date, project.end_date FROM project INNER JOIN user ON (project.project_manager = user.user_id) WHERE project.project_id = ? `, [projectID], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      // console.log("project result.....",result)
      RESPONSE.successHandler(res, 200, {
         ...result[0]
      });

   });

}


const getPhase = (req, res, next) => {

   const searchParams = req.query;
   const projectID = req.params.projectID;
   const phaseNumber = searchParams.phaseNumber;

   pool.query(`SELECT * FROM plan_phase WHERE project_id = ? AND phase_number = ? `, [projectID, phaseNumber], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      // console.log("project result.....",result)
      RESPONSE.successHandler(res, 200, {
         ...result[0]
      });

   });

}




const getAllTags = (req, res, next) => {

   const searchParams = req.query;
   const spaceID = searchParams.spaceID;

   pool.query('SELECT project_tag.tag_name FROM project_tag INNER JOIN project ON project_tag.project_id = ANY (SELECT project_id FROM project WHERE space_id = ?)', [spaceID], (error, result, fields) => {
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }
      console.log("result tags === ...", result);
      // if(!req.response) {
      //    return;
      // }
      RESPONSE.successHandler(res, 200, {
         ...result
      });
   }
   );
}


const createFolder = (req, res, next) => {

   const { folderName, folderID, spaceID, folderPa, date } = req.body;
   const projectID = req.params.projectID;

   let folderPath;
   let folderPathDatabase;

   if (folderPa !== null) {
      folderPath = path.join(req.FolderPath, `${folderPa}`, `${folderName}`);
      folderPathDatabase = `${folderPa}\\` + folderName;
   } else {
      folderPath = path.join(req.FolderPath, 'uploads', 'company', `${req.user.id}`, `space`, `${spaceID}`, 'project', `${projectID}`, `${folderName}`);
      folderPathDatabase = path.join('uploads', 'company', `${req.user.id}`, `space`, `${spaceID}`, 'project', `${projectID}`, `${folderName}`);
   }

   pool.query(`INSERT INTO project_folder_${projectID} SET
   project_id = ?,
   folder_path = ?,
   name = ?,
   create_date = ?,
   parent = ?
`, [projectID, folderPathDatabase, folderName, date, folderID], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }


      fs.mkdir(folderPath, { recursive: true }, (err) => {
         if (err)
            console.log('folder error ...', err)
      });

      RESPONSE.successHandler(res, 200, {
         ...result
      });

   })

}


const createFile = (req, res, next) => {

   const { taskID, employeeID, uploadDate, folderID } = JSON.parse(req.body.fileInfo);

   const projectID = req.params.projectID;

   let file = [req.files[0].path, taskID, projectID, employeeID, req.files[0].filename, req.files[0].mimetype, uploadDate, req.files[0].size, folderID]


   pool.query(`INSERT INTO project_file_${projectID} SET
   file_path = ?,
   task_id = ?,
   project_id = ?,
   employee_id	= ?,
   name = ?,
   type = ?,	
   upload_date = ?,
   size = ?,
   folder_id = ?
   `, file, (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         ...result
      });

   })

}

const renameFile = (req, res, next) => {

   console.log('req.body', req.body);

   let { file_path, new_file_path, name, file_id } = req.body;
   let projectID = req.params.projectID;

   fs.rename(file_path, new_file_path, (err) => {
      if (err) {
         console.log('Error renaming file:', err);
         next(AppError.create(err, 500, "file Rename error"));
         return;
      } else {

         pool.query(`UPDATE project_file_${projectID} SET
   file_path = ?,
   name = ? 
   WHERE file_id = ?
   `, [new_file_path, name, file_id], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            RESPONSE.successHandler(res, 200, {
               ...result
            });

         })

      }

   });

}


const getFolder = (req, res, next) => {

   console.log('req.body', req.body);

   let projectID = req.params.projectID;
   let FolderName = req.params.FolderName;

   console.log("projectID", req.params.projectID);
   console.log("FolderName", req.params.FolderName);

   pool.query(`SELECT folder_path FROM project_folder_${projectID}
   WHERE name = ?
   `, [FolderName], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      console.log("folder_path", result)

      RESPONSE.successHandler(res, 200, {
         ...result[0]
      });

   })


}


const renameFolder = (req, res, next) => {

   console.log('req.body', req.body);

   let { folder_path, new_folder_path, name, folder_id } = req.body;
   let projectID = req.params.projectID;

   fs.rename(folder_path, new_folder_path, (err) => {
      if (err) {
         console.log('Error renaming file:', err);
         next(AppError.create(err, 500, "file Rename error"));
         return;
      } else {

         pool.query(`UPDATE project_folder_${projectID} SET
   folder_path = ?,
   name = ? 
   WHERE folder_id = ?
   `, [new_folder_path, name, folder_id], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            RESPONSE.successHandler(res, 200, {
               ...result
            });

         })

      }

   });

}


const deleteFile = (req, res, next) => {

   let { file_path, file_id } = req.body;
   let projectID = req.params.projectID;

   fs.unlink(file_path, (err) => {
      if (err) {
         console.log('Error renaming file:', err);
         next(AppError.create(err, 500, "file delete error"));
         return;
      } else {

         pool.query(`DELETE FROM project_file_${projectID}
   WHERE file_id = ?
   `, [file_id], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            RESPONSE.successHandler(res, 200, {
               ...result
            });

         })

      }

   });

}


const deleteFolder = (req, res, next) => {

   let { folder_path, folder_id } = req.body;
   let projectID = req.params.projectID;

   fs.rmdir(folder_path, { recursive: true }, (err) => {
      if (err) {
         console.log('Error renaming file:', err);
         next(AppError.create(err, 500, "file delete error"));
         return;
      } else {

         pool.query(`DELETE FROM project_folder_${projectID}
   WHERE folder_id = ?
   `, [folder_id], (error, result, fields) => {
            if (error) {
               console.log("database Error", error);
               next(AppError.create(error, 500, "database Error"));
               return;
            }

            RESPONSE.successHandler(res, 200, {
               ...result
            });

         })

      }

   });

}


const downloadFile = (req, res, next) => {

   let { file_path, name } = JSON.parse(req.query.file);

   res.download(file_path, name, (err) => {
      if (err) {
         console.error('Error downloading file:', err);
      } else {
         console.log('File downloaded successfully!');
      }
   });

}

const downloadFolder = (req, res, next) => {

   let { folder_path, name } = JSON.parse(req.query.folder);

   const folderPath = folder_path + '\\' + `${name}.zip`;
   const folderName = `${name}.zip`;

   try {
      const zip = new AdmZip();
      const outputFile = folderPath;
      zip.addLocalFolder(folder_path);
      zip.writeZip(outputFile);
      console.log(`Created ${outputFile} successfully`);

      res.download(folderPath, folderName, (err) => {
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


const getAllFolder = (req, res, next) => {

   const projectID = req.params.projectID;

   pool.query(`SELECT * FROM project_folder_${projectID} WHERE project_id = ? AND parent IS NULL`, [projectID], (error, result, fields) => {
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         ...result
      });
   }
   );
}



const getSubFolderAndFile = (req, res, next) => {

   const projectID = req.params.projectID;
   const folderID = req.params.folderID;

   console.log('aaaaaaaaaa', projectID)

   pool.query(`SELECT * FROM project_folder_${projectID} WHERE parent = ? `, [folderID], (error, result, fields) => {
      if (error) {
         console.log(error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      pool.query(`SELECT * FROM project_file_${projectID} WHERE folder_id = ? `, [folderID], (error, resultf, fields) => {
         if (error) {
            console.log(error);
            next(AppError.create(error, 500, "database Error"));
            return;
         }

         RESPONSE.successHandler(res, 200, {
            ...result,
            ...resultf
         });
      }
      );

      // RESPONSE.successHandler(res, 200, {
      //    ...result
      // });
   }
   );


}



const getPreventUserToSeeFile = (req, res, next) => {

   const projectID = req.params.projectID;

   pool.query(`
         SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email, user.room_ID FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM project_setting_${projectID}) `, (error, result, fields) => {
      // pool.query(`INSERT INTO project_setting_${projectID} SET employee_id = ?`,[employee],(error,result,fields)=>{
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, result);

   })


}

const getPreventUserToPullRequest = (req, res, next) => {

   const projectID = req.params.projectID;

   pool.query(`
         SELECT employee.employee_id,employee.job_for,user.user_id,user.profile_path, user.public_name, user.email, user.room_ID FROM employee INNER JOIN user USING(user_id) WHERE employee.employee_id IN(SELECT employee_id FROM task_setting_${projectID}) `, (error, result, fields) => {
      // pool.query(`INSERT INTO project_setting_${projectID} SET employee_id = ?`,[employee],(error,result,fields)=>{
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, result);

   })


}



const preventUserToSeeFile = (req, res, next) => {

   const { employee } = req.body;
   const projectID = req.params.projectID;

   console.log("employee", req.body)

   pool.query(`INSERT INTO project_setting_${projectID} SET employee_id = ?`, [employee], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         message: 'employee has been blocked successfully.'
      });

   })

}

const preventUserToPullRequest = (req, res, next) => {

   const { employee } = req.body;
   const projectID = req.params.projectID;

   console.log("employee", req.body)

   pool.query(`INSERT INTO task_setting_${projectID} SET employee_id = ?`, [employee], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         message: 'employee has been blocked successfully.'
      });

   })

}



const allowUserToSeeFile = (req, res, next) => {

   const employee = req.query.employee;
   const projectID = req.params.projectID;

   pool.query(`DELETE FROM project_setting_${projectID} WHERE employee_id = ?`, [employee], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         message: 'employee has been ALLOWED successfully.'
      });

   })

}


const allowUserToPullRequest = (req, res, next) => {

   const employee = req.query.employee;
   const projectID = req.params.projectID;

   pool.query(`DELETE FROM task_setting_${projectID} WHERE employee_id = ?`, [employee], (error, result, fields) => {
      if (error) {
         console.log("database Error", error);
         next(AppError.create(error, 500, "database Error"));
         return;
      }

      RESPONSE.successHandler(res, 200, {
         message: 'employee has been ALLOWED successfully.'
      });

   })

}




module.exports = {
   create,
   getAllProjects,
   getProject,
   getAllTags,
   deleteProject,
   AddPhases,
   getPhase,
   getAllFolder,
   getSubFolderAndFile,
   createFolder,
   createFile,
   renameFile,
   deleteFile,
   renameFolder,
   deleteFolder,
   downloadFile,
   downloadFolder,
   deleteFolderRecursive,
   getFolder,
   preventUserToSeeFile,
   getPreventUserToSeeFile,
   allowUserToSeeFile,
   getPreventUserToPullRequest,
   preventUserToPullRequest,
   allowUserToPullRequest
}
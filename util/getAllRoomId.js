const pool = require('../model/db');

const getAllRoomId = async (id)=>{

   let comp_id;

   console.log('comp_id...',id)
   return new Promise((resolve,reject)=>{

      pool.query(
         "SELECT company_id FROM company WHERE room_ID = ? ",
         [id],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               reject(error)
            }
            comp_id = result[0]?.company_id;
            console.log(comp_id);

            pool.query(
               "SELECT room_id FROM space WHERE company_id = ? ",
               [comp_id],
               (error, result, fields) => {
                  if (error) {
                     console.log(error);
                     reject(error)
                  }
                  // console.log(result);
                  if (result.length > 0) {
                     result = result.map(item=>{
                        return item.room_id;
                     })
                     resolve(result)
                  } else {
                     reject('no room id')
                  }
               }
            );

         }
      );
   })
}


const getAllRoomIdForUser = async (id)=>{

   let comp_id;

   console.log('user_id...',id)
   return new Promise((resolve,reject)=>{

      pool.query(
         "SELECT user_id FROM user WHERE room_ID = ? ",
         [id],
         (error, result, fields) => {
            if (error) {
               console.log(error);
               reject(error)
            }
            comp_id = result[0]?.user_id;
            console.log(comp_id);

            pool.query(
               `SELECT space.room_id FROM space_members INNER JOIN space USING(space_id) WHERE space_members.employee_id IN(SELECT employee_id FROM employee WHERE user_id = ?) AND space_members.is_blocked = 0`,
               [comp_id],
               (error, result, fields) => {
                  if (error) {
                     console.log(error);
                     reject(error)
                  }
                  // console.log(result);
                  if (result.length > 0) {
                     result = result.map(item=>{
                        return item.room_id;
                     })
                     resolve(result)
                  } else {
                     reject('no room id')
                  }
               }
            );

         }
      );
   })
}


module.exports = {
   getAllRoomId,
   getAllRoomIdForUser
}; 
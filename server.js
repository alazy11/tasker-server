const express = require('express');
const http = require('node:http');
const compression = require('compression');
const path = require('node:path');
const {Server} = require('socket.io');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const {register} = require('./route/registerRouting')
const RESPONSE = require('./handlers/errorHandler');
const { login } = require('./route/loginRouter');
const USER = require('./route/userRouter');
const COMPANY = require('./route/companyRouter');
const SPACE  = require('./route/spaceRouter');
const PROJECT  = require('./route/projectRouter');
const TASK  = require('./route/taskRouter');
// const multer = require('multer');
const {getAllRoomId,getAllRoomIdForUser} = require('./util/getAllRoomId');
const {storeSpaceMessage} = require('./util/storeMessage');
const isTheCreator = require('./util/isTheCreator');
const deleteMeeting = require('./util/deleteMeeting');

const PORT = 4040;
const app = express();
const httpServer = http.createServer(app);

const folderPath = path.join(__dirname);

app.use(cors({
   origin: process.env.FRONT_URL,
   credentials:true,
}))

app.use(compression());

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
app.use(express.static("uploads"));
app.use('/uploads', express.static('uploads'));

// Takes the raw requests and turns them into usable properties on req.body
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req,res,next)=>{
   req.FolderPath = folderPath;
   const destinationPath  = path.join(`${req.FolderPath}`,`${req.header('folderFilePath')}`);
   req.destinationPath = destinationPath;
   next();
})
app.use('/:lang/register',register);
app.use('/:lang/login',login);
app.use('/:lang/user',USER);
app.use('/:lang/company',COMPANY);
app.use('/:lang/company/space',SPACE);
app.use('/:lang/company/space/:spaceID/project',PROJECT);
app.use('/:lang/company/space/:spaceID/project/:projectID/task',(req,res,next)=>{
   req.par = {...req.params};
   next();
},TASK);
app.use((error,req,res,next)=>{
   RESPONSE.errorHandler(res,error.statusCode,error.message);
   // res.status(error.statusCode).json({msg:error.message});
})


const socketOptions = {
   cors: {
      origin: [process.env.FRONT_URL],
      credentials:true,
   },
   connectionStateRecovery: {}
}

const io = new Server(httpServer,
   socketOptions
);


// io.engine.use((req, res, next) => {
//    console.log('socket req...',socket.handshake.auth.roomId);
// });

io.on('connection',async (socket)=>{

   const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query
   const type = socket.handshake.auth.type; // Extract the cookies from the query

   if(roomId) {
      console.log("room id ok",roomId)
      socket.join(roomId);
      if(type === 'company') {
         console.log("room id company")
         try{
            let r = await getAllRoomId(roomId);
            console.log('company roooms id ..askld',r);
            socket.join(r);
            console.log("....company",socket.rooms);
         } catch(err) {
            console.log(err)
         }
         
         // console.log('company id',roomId);
         io.to(roomId).emit('message',roomId);

      } else if(type === 'user') {
         console.log("room id user")
      try{
         let r = await getAllRoomIdForUser(roomId);
         console.log('user roooms id ..askld',r);
         socket.join(r);
         console.log("....user",socket.rooms);
      } catch(err) {
         console.log(err)
      }
      
      // console.log('user id',roomId);
      userSocket.to(roomId).emit('message',roomId);
      } else {
         console.log("room id no type")
      }

   } else {
      console.log('no roomid socket');
      socket.emit('roomId',(roomId)=>{
         console.log('company .. id',roomId);
         socket.join(roomId);
      })
      // socket.disconnect(true)
   }

   //? socket space chat event ////////////////////////////////////////////

   socket.on('spaceMessage',async(information,cb)=>{
      console.log("information",information);
      let isStored;
      try{
         isStored = await storeSpaceMessage(information);
      } catch(err) {
         isStored = err;
      }

      if(isStored.isStored) {
         information.ms_id = isStored.ms_id;
         socket.to(information.room_id).emit('spaceMessage',information);
         cb(null,true);
      } else {
         cb(null,false);
      }
   });

   socket.on('lockedChat',async(roomId,isLock)=>{
      socket.to(roomId).emit('lockedChat',isLock);
   });

   socket.on('BlockChatUser',async(roomId,isBlocked)=>{
      
      console.log("BlockChatUser",await io.in(roomId).sockets)

      socket.to(roomId).emit('BlockChatUser',isBlocked);
   });

   socket.on('deleteMessage',async(roomId,ms_id)=>{

      console.log("deleteMessage",ms_id)

      socket.to(roomId).emit('deleteMessage',ms_id);
   });


   //? ///////////////////////////////////////////////////////////////////



   //? //////////////////// meetting room events  ///////////////////////////////////////////////

   socket.on("newUserConnect",(roomId,user,connectId)=>{

      console.log("newUserConnect",roomId)

      socket.to(roomId).emit('newUserConnect',user,connectId);
   })

   socket.on("userLeaving",(roomId,user,connectId)=>{

      console.log("userLeaving",connectId)
      socket.to(roomId).emit('userLeaving',user,connectId);
   })

   
   socket.on("startMeeting",(roomId,meetId,spaceID)=>{
      console.log("startMeeting",roomId)
      socket.to(roomId).emit('startMeeting',roomId,meetId,spaceID);
   })

   socket.on("endMeeting",(roomId,meetingID)=>{
      console.log("endMeeting",roomId);
      deleteMeeting({meetingID})
      socket.to(roomId).emit('endMeeting',meetingID);
   })
   // socket.emit('isThereMeeting',spaceID)
   // socket.emit('closeCamera',roomId,user.room_ID,!camera)
   socket.on("closeCamera",(roomId,user,camera)=>{
      console.log("endMeeting",user);
      socket.to(roomId).emit('closeCamera',roomId,user,camera);
   })

   socket.on("stopUser",(roomId,user,active)=>{
      console.log("stopUser",roomId);
      socket.to(roomId).emit('stopUser',user,active);
   })

   socket.on("firedUser",(roomId,user)=>{
      console.log("firedUser",user);
      socket.to(roomId).emit('firedUser',user);
   });




   //? /////////////////////////////////////////// ///////////////////////////////////////////////



   socket.on('new order',(user)=>{
      io.to(user).emit("new order",'you have new order');
   })

   socket.on('accept join',(user)=>{
      io.to(user).emit("accept join",'the user ali accept the join employee.');
   })

   socket.on('reject join',(user)=>{
      io.to(user).emit("reject join",'the user ali reject the join employee.');
   })


   socket.on('disconnect',(reason)=>{
      
      console.log("disc....disconnect",socket.rooms,"  ",reason);
      console.log('socket disconnect normal > ',reason);
   });

   socket.on("disconnecting", async (reason) => {

      console.log("disc....disconnecting",[...socket.rooms.values()],"  ",reason);

      let creator;
      let user = [...socket.rooms.values()][1];

      console.log('creator',user)
      creator = await isTheCreator(user);
      if(creator) {
         deleteMeeting({creator:user});
      }

      io.to(socket.rooms.values()).emit('disconnectUser',user);

   });

});


const companySocket = io.of('/company');

companySocket.on('connection',async (socket)=>{
   console.log("connection ok")
   // console.log("socket cookie",socket.handshake.auth.token)
   // console.log("socket cookie req",socket.request.headers.cookie)
   // let userr;

   // const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query

   // Access the individual cookies
   // const token = cookies.token;
   // console.log('company-----:', roomId);

   // if(roomId) {
   //    socket.join(roomId);
   //    try{
   //       let r = await getAllRoomId(roomId);
   //       console.log('company roooms id ..askld',r);
   //       socket.join(r);
   //       console.log("....company",socket.rooms);
   //    } catch(err) {
   //       console.log(err)
   //    }
      
   //    console.log('company id',roomId);
   //    companySocket.to(roomId).emit('message',roomId);
   // } else {
   //    console.log('no roomid socket');
   //    socket.emit('roomId',(roomId)=>{
   //       console.log('company .. id',roomId);
   //       socket.join(roomId);
   //    })
   //    // socket.disconnect(true)
   // }

   socket.on('message',(ms,rr,cb)=>{
      console.log('client company msg',ms);
      console.log('client company id',rr);
      // cb('ok send');
      companySocket.to(rr).emit('message',ms);
      console.log("company rooms...",socket.rooms)
   })

   // socket.on('disconnect',(reason)=>{
   //    console.log('socket disconnect company > ',reason);
   // });

   // socket.on("disconnecting", (reason) => {
   //    console.log("disc....company",socket.rooms,"  ",reason); // Set { ... }
   // });

});

const userSocket = io.of('/user');

userSocket.on('connection',async (socket)=>{
   console.log("connection ok")
   // console.log("socket cookie",socket.handshake.auth.token)
   // console.log("socket cookie req",socket.request.headers.cookie)
   // let userr;

   // const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query

   // // Access the individual cookies
   // // const token = cookies.token;
   // console.log('user-----:', roomId);

   // if(roomId) {
   //    socket.join(roomId);
   //    try{
   //       let r = await getAllRoomIdForUser(roomId);
   //       console.log('user roooms id ..askld',r);
   //       socket.join(r);
   //       console.log("....user",socket.rooms);
   //    } catch(err) {
   //       console.log(err)
   //    }
      
   //    // console.log('user id',roomId);
   //    userSocket.to(roomId).emit('message',roomId);
   // } else {
   //    console.log('disconnection socket');
   //    socket.emit('roomId',(roomId)=>{
   //       console.log('user .. id',roomId);
   //       socket.join(roomId);
   //    })
   //    // socket.disconnect(true)
   // }

   socket.on('message',(ms,rr,cb)=>{
      console.log('client company msg',ms);
      console.log('client company id',rr);
      // cb('ok send');
      userSocket.to(rr).emit('message',ms);
      // console.log("user rooms...",socket.rooms)
   })

   // socket.on('disconnect',(reason)=>{
   //    console.log('socket disconnect user > ',reason);
   // });

   // socket.on("disconnecting", (reason) => {
   //    console.log("disc....user",socket.rooms,"  ",reason); // Set { ... }
   // });

});


let p = process.env.PORT || PORT;

httpServer.listen(p,()=>{
   console.log(`server running on port ${p}`);
});

module.exports = {
};
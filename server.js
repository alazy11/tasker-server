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
app.use(express.static(path.join(__dirname, "uploads")));

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
app.use('/:lang/company/space/:spaceID/project/:projectID/task',TASK);
app.use((error,req,res,next)=>{
   RESPONSE.errorHandler(res,error.statusCode,error.message);
   // res.status(error.statusCode).json({msg:error.message});
})




// const storage = multer.diskStorage({
//    destination: (req, file, cb) => {
//       const destinationPath  = path.join(`${req.FolderPath}`,`${req.body.folderFilePath}`);
//       console.log('path....file',req.body.folderFilePath)
//        cb(null, destinationPath);
//       //  cb(null, './uploads/company/4/space/427db24566a/project/427db24566a41fc9821dc/public');
//    },
//    filename: (req, file, cb) => {
//        const fileName = file.originalname.toLowerCase().split(' ').join('-');
//        cb(null, fileName)
//    }
// });

// const upload = multer({
//    storage: storage,
//    // fileFilter: (req, file, cb) => {
//    //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
//    //         cb(null, true);
//    //     } else {
//    //         cb(null, false);
//    //         return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
//    //     }
//    // }
// });



// app.post('/:lang/company/space/:spaceID/project/:projectID/folder/:folderID/file',authJWTUser,upload.single('file'),(req, res, next)=>{
//    console.log("req.body.files)",req.body.file)
//    console.log("req.file)",req.file)

//    res.status(200).json({
//       data: req.body.files
//    })

// });




const socketOptions = {
   cors: {
      origin: [process.env.FRONT_URL],
      credentials:true,
   },
   connectionStateRecovery: {}
}

const io = new Server(httpServer,socketOptions);


// io.engine.use((req, res, next) => {
//    console.log('socket req...',socket.handshake.auth.roomId);
// });

io.on('connection',(socket)=>{

   const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query

   if(roomId) {
      socket.join(roomId);
      console.log('company id',roomId);
      // io.to(roomId).emit('message',roomId);
   } else {
      console.log('disconnection socket');
      socket.emit('roomId',(roomId)=>{
         console.log('company .. id',roomId);
         socket.join(roomId);
      })
      // socket.disconnect(true)
   }


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
      console.log('socket disconnect normal > ',reason);
   });

   socket.on("disconnecting", (reason) => {
      console.log("disc....normal",socket.rooms,"  ",reason); // Set { ... }
   });

});


const companySocket = io.of('/company');

companySocket.on('connection',(socket)=>{
   console.log("connection ok")
   // console.log("socket cookie",socket.handshake.auth.token)
   // console.log("socket cookie req",socket.request.headers.cookie)
   // let userr;

   const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query

   // Access the individual cookies
   // const token = cookies.token;
   console.log('company-----:', roomId);

   if(roomId) {
      socket.join(roomId);
      console.log('company id',roomId);
      companySocket.to(roomId).emit('message',roomId);
   } else {
      console.log('disconnection socket');
      socket.emit('roomId',(roomId)=>{
         console.log('company .. id',roomId);
         socket.join(roomId);
      })
      // socket.disconnect(true)
   }

   socket.on('message',(ms,rr,cb)=>{
      console.log('client company msg',ms);
      console.log('client company id',rr);
      // cb('ok send');
      companySocket.to(rr).emit('message',ms);
      console.log("company rooms...",socket.rooms)
   })

   socket.on('disconnect',(reason)=>{
      console.log('socket disconnect company > ',reason);
   });

   socket.on("disconnecting", (reason) => {
      console.log("disc....company",socket.rooms,"  ",reason); // Set { ... }
   });

});

const userSocket = io.of('/user');

userSocket.on('connection',(socket)=>{
   console.log("connection ok")
   // console.log("socket cookie",socket.handshake.auth.token)
   // console.log("socket cookie req",socket.request.headers.cookie)
   // let userr;

   const roomId = socket.handshake.auth.roomId; // Extract the cookies from the query

   // Access the individual cookies
   // const token = cookies.token;
   console.log('user-----:', roomId);

   if(roomId) {
      socket.join(roomId);
      console.log('user id',roomId);
      userSocket.to(roomId).emit('message',roomId);
   } else {
      console.log('disconnection socket');
      socket.emit('roomId',(roomId)=>{
         console.log('user id',roomId);
         socket.join(roomId);
      })
      // socket.disconnect(true)
   }

   socket.on('message',(ms,rr,cb)=>{
      console.log('client msg',ms);
      console.log('client id',rr);
      // cb('ok send');
      userSocket.in(rr).emit('message',ms);
      console.log("user rooms...",socket.rooms)
   })


   socket.on('disconnect',(reason)=>{
      console.log('socket disconnect > ',reason);
   });

   socket.on("disconnecting", (reason) => {
      console.log("disc....",socket.rooms,"  ",reason); // Set { ... }
   });

});


let p = process.env.PORT || PORT;

httpServer.listen(p,()=>{
   console.log(`server running on port ${p}`);
});

module.exports = {
};
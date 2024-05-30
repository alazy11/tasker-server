const {io,app} = require('./server');
const AppError = require('./util/customError')

// io.use((socket, next)=>{
//    next(AppError.create('not authorized',401,'jwt error'))
// })

io.on('connection',(socket)=>{
   console.log("connection ok")
   console.log("socket cookie",socket.request.headers.cookie)
   console.log(process.env.FRONT_URL);
   io.emit('message',socket.request.headers.cookie);
});
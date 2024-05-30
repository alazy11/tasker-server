const SUCCESS = {
   status:'success',
   data: {}
};

const FAIL = {
   status:'fail',
   data: {}
};

const ERROR = {
   status:'error',
   message: ''
};

function successHandler(res,code,data) {
   SUCCESS.data = data;
   return res.status(code).json(SUCCESS);
}
function failHandler(res,code,data) {
   FAIL.data = data;
   return res.status(code).json(FAIL);
}
function errorHandler(res,code=500,message) {
   ERROR.message = message;
   return res.status(code).json(ERROR);
}

module.exports = {
   successHandler,
   failHandler,
   errorHandler
}
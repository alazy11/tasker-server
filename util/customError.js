class AppError extends Error{
   constructor() {
      super();
   }

   create(message, statusCode, statusText) {
      this.message = message;
      this.statusCode = statusCode;
      this.statusText = statusText;

      console.log("this.statusText ",this.statusText)

      return this;
   }
   
}

module.exports = new AppError();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth :{
      user:'taskertool24@gmail.com',
      pass:'tasker tool 123'
   }
});

module.exports = transporter;
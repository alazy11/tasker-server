// const Recipient = require("mailersend").Recipient;
// const EmailParams = require("mailersend").EmailParams;
// const MailerSend = require("mailersend").MailerSend;
// const Sender = require("mailersend").Sender;

// const mailerSend = new MailerSend({
//    apiKey: process.env.API_KEY,
//  });
 
//  const sentFrom = new Sender("MS_apHeAL@trial-zr6ke4njjymgon12.mlsender.net", "Tasker");
 
//  const recipients = [
//    new Recipient("alazyalhimeari11@gmail.com", "alazy")
//  ];
 
//  const emailParams = new EmailParams()
//    .setFrom(sentFrom)
//    .setTo(recipients)
//    .setReplyTo(sentFrom)
//    .setSubject("This is a Subject")
//    .setHtml("<strong>This is the HTML content</strong>")
//    .setText("This is the text content");

// //  try {
// //     await mailerSend.email.send(emailParams);
// //  } catch(err) {
// //    console.log(err)
// //  }

// // module.exports = mailerSend
// const nodemailer = require("nodemailer");


// const transporter = nodemailer.createTransport({
//   host: "smtp.tickpluswise.com",
//   port: 500,
//   secure: false, // Use `true` for port 465, `false` for all other ports
//   auth: {
//     user: "user-0d70df25d04ae8e2",
//     pass: "2jGNDdfsyZbAhXMApdpjUbifW10g",
//   },
// });

// //  const info = await
//  transporter.sendMail({
//   from: '"Maddison Foo Koch 👻" <user-0d70df25d04ae8e2>', // sender address
//   to: "alazyalhimeari11@gmail.com", // list of receivers
//   subject: "Hello ✔", // Subject line
//   text: "Hello world?", // plain text body
//   html: "<b>Hello world?</b>", // html body
// },
// (error, info) => {
//   if (error) {
//     console.error('Error occurred while sending email:', error);
//   } else {
//     console.log('Email sent successfully:', info.response);
//   }
// }
// );
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTY2MzMsInRlc3RfZW1haWwiOmZhbHNlLCJpYXQiOjE3MTkzNzE4MDUsImV4cCI6NDg3NTEzMTgwNX0.jOkfctFof1UPOt-VWuc8pu8yKQekGoTZHylupO-M_-Y

/**
 *
 * Run:
 *
 */


const mailjet = require('node-mailjet');
// mailjet.
const mailjet = require('node-mailjet').connect(
  "7ba5b647319df2ac25638e2dc50b74df",
  'b260d843f7367c4df466c0b898204f77'
)
const request = mailjet.post('send', { version: 'v3.1' }).request({
  Messages: [
    {
      From: {
        Email: 'taskertool24@gmail.com',
        Name: 'Me',
      },
      To: [
        {
          Email: 'alazyalhimeari11@gmail.com',
          Name: 'You',
        },
      ],
      Subject: 'My first Mailjet Email!',
      TextPart: 'Greetings from Mailjet!',
      HTMLPart:
        '<h3>Dear passenger 1, welcome to <a href="https://www.mailjet.com/">Mailjet</a>!</h3><br />May the delivery force be with you!',
    },
  ],
})
request
  .then(result => {
    console.log(result.body)
  })
  .catch(err => {
    console.log(err.statusCode)
  })
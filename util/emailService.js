require('dotenv').config();
const {Recipient} = require("mailersend");
const {EmailParams} = require("mailersend");
const {MailerSend} = require("mailersend");
const {Sender} = require("mailersend");


// const mailerSend = new MailerSend({
//   // apiKey: process.env.API_KEY,
//   apiKey: "mlsn.b7118cd58c3ce2b8023c02e959520dba84d290b6b3877aaf7f0bf02df6209e2a"
// });

// const sentFrom = new Sender("taskerTeam@tasker-tool.com", "Tasker");

// const recipients = [
//   new Recipient("alazyalhimeari11@gmail.com", "Your Client")
// ];
// // const cc = [
// //   new Recipient("your_cc@client.com", "Your Client CC")
// // ];
// // const bcc = [
// //   new Recipient("your_bcc@client.com", "Your Client BCC")
// // ];

// const emailParams = new EmailParams()
//   .setFrom(sentFrom)
//   .setTo(recipients)
//   // .setCc(cc)
//   // .setBcc(bcc)
//   .setSubject("Tasker team")
//   .setHtml("<strong>This is the HTML content</strong>")
//   .setText("This is the text content");

// mailerSend.email
// 	.send(emailParams)
//   .then((response) => console.log(response))
//   .catch((error) => console.log(error));


const sendSecretKeyEmail = (senderEmail,senderName,recipientEmail,recipientName,subject,content) =>{

  const mailerSend = new MailerSend({
    // apiKey: process.env.API_KEY,
    apiKey: "mlsn.b7118cd58c3ce2b8023c02e959520dba84d290b6b3877aaf7f0bf02df6209e2a"
  });
  
  const sentFrom = new Sender(senderEmail, senderName);
  
  const recipients = [
    new Recipient(recipientEmail, recipientName)
  ];

  const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  // .setCc(cc)
  // .setBcc(bcc)
  .setSubject(subject)
  .setHtml(content)
  .setText("This is the text content");

mailerSend.email
	.send(emailParams)
  .then((response) => console.log(response))
  .catch((error) => console.log(error));

}


module.exports = {
  sendSecretKeyEmail
}
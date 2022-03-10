const nodemailer = require("nodemailer");
export class NodeMailer {
  async nodemailer(req: any, res: any) {
    const email_text = req.body.text;
    const email_subject = req.body.subject
    var email_reciever="newbienate80@gmail.com"

    if(req.body.reciever!=undefined)
        email_reciever = req.body.reciever

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
          clientId: process.env.OAUTH_CLIENTID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
      });

      let mailOptions = {
        from: 'test.bot.email.automation@gmail.com',
        to: email_reciever,
        subject: email_subject,
        text: email_text
      };

      transporter.sendMail(mailOptions, function(err:any, data:any) {
        if (err) {
          res.send({"message":"Error in transporter "+err.message})
          console.log(data)
        } else {
          res.send({"message":"Email sent succesfully"})
        }
      });
  }
}
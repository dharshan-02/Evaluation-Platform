const nodemailer = require('nodemailer');

/**
 * Utility to send emails.
 * Uses Ethereal Email by default for local development.
 * It will print a URL in the console where the email can be previewed.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();

    // Create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Neo-Vika System" <noreply@neovika.com>', // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

module.exports = sendEmail;

const nodemailer = require('nodemailer');

// trimite un email folosind un cont Gmail, configurat din variabilele de mediu
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
  from: process.env.EMAIL_USER,
  to: options.email,
  subject: options.subject,
  text: options.message,
  html: options.html      
};

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
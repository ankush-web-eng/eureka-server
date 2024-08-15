const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  tls: {
    ciphers: "SSLv3",
  },
  secure: false, 
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, verifyCode: string): Promise<{ success: boolean, message: string }> {

  const mailOptions = {
    from: `"Medzo" <${process.env.EMAIL}>`,
    to: email,
    subject: "Medzo Doctor - Verify your email",
    text: `Hello Dr., Your verification code for ${email} is ${verifyCode}`,
    html: `<b>Hello Dr., Your verification code for ${email} is ${verifyCode}</b>`,
  }

  try {
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err: Error, info: any) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(info);
        }
      });
    });

    return { success: true, message: 'Verification email sent successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to send verification email.' };
  }
}
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
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
function sendVerificationEmail(email, verifyCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: `"Medzo" <${process.env.EMAIL}>`,
            to: email,
            subject: "Medzo Doctor - Verify your email",
            text: `Hello Dr., Your verification code for ${email} is ${verifyCode}`,
            html: `<b>Hello Dr., Your verification code for ${email} is ${verifyCode}</b>`,
        };
        try {
            yield new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    else {
                        resolve(info);
                    }
                });
            });
            return { success: true, message: 'Verification email sent successfully.' };
        }
        catch (error) {
            return { success: false, message: 'Failed to send verification email.' };
        }
    });
}

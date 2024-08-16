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
exports.sendAppointmentSuccessMail = sendAppointmentSuccessMail;
const nodemailer_1 = require("../config/nodemailer");
function sendAppointmentSuccessMail(email, patient, doctor) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: `"Medzo" <${process.env.EMAIL}>`,
            to: email,
            subject: `Medzo - Appointment with Dr. ${doctor}`,
            text: `Dear ${patient}, You have successfully met the Dr. ${doctor} and discussed your health issues. Please follow the prescription and take care of your health.`,
            html: `<b>Dear ${patient}, You have successfully met the Dr. ${doctor} and discussed your health issues. Please follow the prescription and take care of your health.</b>`,
        };
        try {
            yield new Promise((resolve, reject) => {
                nodemailer_1.transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
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

import { transporter } from "../config/nodemailer";

export async function sendAppointmentSuccessMail(email: string, patient: string, doctor: string): Promise<{ success: boolean, message: string }> {
    const mailOptions = {
        from: `"Medzo" <${process.env.EMAIL}>`,
        to: email,
        subject: `Medzo - Appointment with Dr. ${doctor}`,
        text: `Dear ${patient}, You have successfully met the Dr. ${doctor} and discussed your health issues. Please follow the prescription and take care of your health.`,
        html: `<b>Dear ${patient}, You have successfully met the Dr. ${doctor} and discussed your health issues. Please follow the prescription and take care of your health.</b>`,
    }

    try {
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err: Error, info: any) => {
                if (err) {
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
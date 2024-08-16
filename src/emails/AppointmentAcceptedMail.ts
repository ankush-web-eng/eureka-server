import { transporter } from "../config/nodemailer";

export async function sendAppointmentAcceptedMail(email: string, patient: string, doctor: string): Promise<{ success: boolean, message: string }> {
    const mailOptions = {
        from: `"Medzo" <${process.env.EMAIL}>`,
        to: email,
        subject: "Medzo - Appointment Accepted",
        text: `Dear ${patient}, Your appointment has been accepted by the Dr. ${doctor}. Please be there on time.`,
        html: `<b>Dear ${patient}, Your appointment has been accepted by the Dr. ${doctor}. Please be there on time.</b>`,
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
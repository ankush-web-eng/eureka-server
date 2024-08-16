import { transporter } from "../config/nodemailer";

export async function sendAppointmentRejectedMail(email: string, patient: string, doctor: string): Promise<{ success: boolean, message: string }> {
    const mailOptions = {
        from: `"Medzo" <${process.env.EMAIL}>`,
        to: email,
        subject: "Medzo - Appointment Rejected",
        text: `Dear ${patient}, Your appointment has been rejected by the Dr. ${doctor}. Please try again within given slots only.`,
        html: `<b>Dear ${patient}, Your appointment has been rejected by the Dr. ${doctor}. Please try again within given slots only.</b>`,
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
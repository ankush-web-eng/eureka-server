import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'

const router = Router();

router.get("/user/:email", async (req: Request, res: Response) => {
    try {
        const email = req.params.email
        console.log(email)
        const user = await prisma.patient.findUnique({
            where: {
                email
            },
            include: {
                appointments: {
                    include: {
                        doctor: true
                    }
                },
                history: {
                    include: {
                        doctor: true
                    }
                }
            }
        })
        console.log(user)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(user)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post("/user/create/:email", async (req: Request, res: Response) => {
    try {
        const email = req.params.email
        const city = req.body.city
        console.log(email, city)
        const user = await prisma.patient.create({
            data: {
                email,
                city
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User Creation failed" })
        }
        return res.json(user)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/doctors', async (req: Request, res: Response) => {
    const city = req.query.city as string;
    try {
        const doctors = await prisma.doctor.findMany({
            where: {
                city
            },
            include: {
                availableTimes: true,
                appointments: true,
                history: true,
            }
        })
        if (!doctors) {
            return res.status(404).json({ message: "No Doctors found" })
        }
        console.log(doctors)
        res.json(doctors)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post('/appointments/create', async (req: Request, res: Response) => {
    try {
        const patientEmail = req.query.patientEmail as string;
        const { doctorId, date } = req.body;
        const appointmentDate = new Date(date);

        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: { availableTimes: true }
        });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // const isTimeAvailable = doctor.availableTimes.some(timeSlot => {
        //     const startTime = new Date(timeSlot.startTime);
        //     const endTime = new Date(timeSlot.endTime);
        //     return appointmentDate >= startTime && appointmentDate <= endTime;
        // });

        // if (!isTimeAvailable) {
        //     return res.status(400).json({ message: "The selected time is not within the doctor's availability." });
        // }

        // Check for overlapping appointments
        // const overlappingAppointment = await prisma.appointment.findFirst({
        //     where: {
        //         doctorId: doctorId,
        //         date: {
        //             gte: appointmentDate,
        //             lt: new Date(appointmentDate.getTime() + 60 * 60 * 1000) // Assuming 1 hour slots
        //         }
        //     }
        // });

        // if (overlappingAppointment) {
        //     return res.status(400).json({ message: "The selected time is already booked." });
        // }

        const appointment = await prisma.appointment.create({
            data: {
                date: appointmentDate,
                patient: {
                    connect: {
                        email: patientEmail
                    }
                },
                doctor: {
                    connect: {
                        id: doctorId
                    }
                }
            }
        });

        if (!appointment) {
            return res.status(400).json({ message: "Appointment not created" });
        }

        console.log(patientEmail, doctorId, date);
        return res.json({ message: "Appointment Created" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;

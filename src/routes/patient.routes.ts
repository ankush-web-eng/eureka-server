import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'

const router = Router();

router.get("/user/:email", async (req: Request, res: Response) => {
    try {
        const email = req.params.email

        const user = await prisma.patient.findUnique({
            where: {
                email
            },
            include: {
                appointments: {
                    include: {
                        doctor: {
                            include: {
                                hospital: true
                            }
                        }
                    }
                },
                history: {
                    include: {
                        doctor: {
                            include : {
                                hospital: true
                            }
                        }
                    }
                }
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post("/user/create/:email", async (req: Request, res: Response) => {
    try {
        const email = req.params.email;
        const { city, name } = req.body;

        const isUserExist = await prisma.patient.findUnique({
            where: {
                email
            }
        })

        if (isUserExist) {
            return res.status(200).json({ message: "User already exists" })
        }

        const user = await prisma.patient.create({
            data: {
                email,
                city,
                name
            }
        })

        if (!user) {
            return res.status(404).json({ message: "User Creation failed" })
        }
        return res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/doctors', async (req: Request, res: Response) => {
    const city = req.query.city as string;

    try {
        const doctors = await prisma.hospital.findMany({
            where: {
                city
            },
            include: {
                doctor: {
                    include: {
                        availableTimes: true,
                    }
                }
            }
        })
        if (!doctors) {
            return res.status(404).json({ message: `No Doctors found ${city}!!` })
        }
        res.json(doctors);
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

        return res.json({ message: "Appointment Created" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;

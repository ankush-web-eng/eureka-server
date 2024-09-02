import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'
import { cacheDoctorData, getCachedDoctorData } from '../lib/redis';

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
                            include: {
                                hospital: true
                            }
                        }
                    }
                }
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/user/create/:email", async (req: Request, res: Response) => {
    try {
        const email = req.params.email;
        const { city, name } = req.body;

        const isUserExist = await prisma.patient.findUnique({
            where: {
                email
            }
        });

        if (isUserExist) {
            await prisma.patient.update({
                where: {
                    email
                },
                data: {
                    city,
                    name
                }
            });
            return res.status(200).json({ message: "User already exists" });
        }

        const user = await prisma.patient.create({
            data: {
                email,
                city,
                name
            }
        })

        if (!user) {
            return res.status(404).json({ message: "User Creation failed" });
        }
        return res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
});

router.get('/doctors', async (req: Request, res: Response) => {
    const city = req.query.city as string;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `doctors:${city}:page:${page}:limit:${limit}`;

    const cachedDoctors = await getCachedDoctorData(cacheKey);

    if (cachedDoctors) {
        return res.json(cachedDoctors);
    }

    try {
        const [doctors, totalDoctors] = await Promise.all([
            prisma.hospital.findMany({
                where: { city },
                include: {
                    doctor: {
                        include: {
                            availableTimes: true,
                        }
                    }
                },
                skip: offset,
                take: limit,
            }),
            prisma.hospital.count({
                where: { city },
            }),
        ]);

        if (doctors.length === 0) {
            return res.status(404).json({ message: `No Doctors found in ${city}!!` });
        }

        const totalPages = Math.ceil(totalDoctors / limit);

        const response = {
            doctors,
            meta: {
                totalDoctors,
                totalPages,
                currentPage: page,
            }
        };

        await cacheDoctorData(cacheKey, response, 900);

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


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

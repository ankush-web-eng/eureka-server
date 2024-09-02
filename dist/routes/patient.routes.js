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
const express_1 = require("express");
const db_1 = require("../lib/db");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
router.get("/user/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const user = yield db_1.prisma.patient.findUnique({
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
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post("/user/create/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const { city, name } = req.body;
        const isUserExist = yield db_1.prisma.patient.findUnique({
            where: {
                email
            }
        });
        if (isUserExist) {
            yield db_1.prisma.patient.update({
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
        const user = yield db_1.prisma.patient.create({
            data: {
                email,
                city,
                name
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User Creation failed" });
        }
        return res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.get('/doctors', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const city = req.query.city;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const cacheKey = `doctors:${city}:page:${page}:limit:${limit}`;
    const cachedDoctors = yield (0, redis_1.getCachedDoctorData)(cacheKey);
    if (cachedDoctors) {
        return res.json(cachedDoctors);
    }
    try {
        const [doctors, totalDoctors] = yield Promise.all([
            db_1.prisma.hospital.findMany({
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
            db_1.prisma.hospital.count({
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
        yield (0, redis_1.cacheDoctorData)(cacheKey, response, 900);
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/appointments/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientEmail = req.query.patientEmail;
        const { doctorId, date } = req.body;
        const appointmentDate = new Date(date);
        const doctor = yield db_1.prisma.doctor.findUnique({
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
        const appointment = yield db_1.prisma.appointment.create({
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
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;

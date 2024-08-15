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
                        doctor: true
                    }
                },
                history: {
                    include: {
                        doctor: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post("/user/create/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const city = req.body.city;
        console.log(email, city);
        const user = yield db_1.prisma.patient.create({
            data: {
                email,
                city
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
// router.get('/doctors', async (req: Request, res: Response) => {
//     const city = req.query.city as string;
//     try {
//         const doctors = await prisma.hospital.findMany({
//             where: {
//                 city
//             },
//             include: {
//                 availableTimes: true,
//                 appointments: true,
//                 history: true,
//             }
//         })
//         if (!doctors) {
//             return res.status(404).json({ message: "No Doctors found" })
//         }
//         console.log(doctors)
//         res.json(doctors)
//     } catch (error) {
//         res.status(500).json({ message: "Internal Server Error" })
//     }
// })
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
        // Check doctor's availability at given time slot
        const isTimeAvailable = doctor.availableTimes.some(timeSlot => {
            const startTime = new Date(timeSlot.startTime);
            const endTime = new Date(timeSlot.endTime);
            return appointmentDate >= startTime && appointmentDate <= endTime;
        });
        if (!isTimeAvailable) {
            return res.status(400).json({ message: "The selected time is not within the doctor's availability." });
        }
        // Check for overlapping appointments
        const overlappingAppointment = yield db_1.prisma.appointment.findFirst({
            where: {
                doctorId: doctorId,
                date: {
                    gte: appointmentDate,
                    lt: new Date(appointmentDate.getTime() + 60 * 60 * 1000) // Assuming 1 hour slots
                }
            }
        });
        if (overlappingAppointment) {
            return res.status(400).json({ message: "The selected time is already booked." });
        }
        // create appointment
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

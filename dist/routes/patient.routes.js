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
        console.log(email);
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
        console.log(user);
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
router.get('/doctors', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const city = req.query.city;
    try {
        const doctors = yield db_1.prisma.doctor.findMany({
            where: {
                city
            },
            include: {
                availableTimes: true,
                appointments: true,
                history: true,
            }
        });
        if (!doctors) {
            return res.status(404).json({ message: "No Doctors found" });
        }
        console.log(doctors);
        res.json(doctors);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/appointments/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientEmail = req.query.patientEmail;
        const { doctorId, date } = req.body;
        const isAppointmentBookedAlready = yield db_1.prisma.appointment.findFirst({
            where: {
                patientId: patientEmail,
                date,
            }
        });
        if (isAppointmentBookedAlready) {
            return res.status(400).json({ message: "Appointment already booked" });
        }
        const appointment = yield db_1.prisma.appointment.create({
            data: {
                date: new Date(date),
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

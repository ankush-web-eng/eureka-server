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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const express_2 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const VerificationMail_1 = require("../emails/VerificationMail");
const AppointmentAcceptedMail_1 = require("../emails/AppointmentAcceptedMail");
const AppointmentRejected_1 = require("../emails/AppointmentRejected");
const AppointmentSuccess_1 = require("../emails/AppointmentSuccess");
const router = (0, express_1.Router)();
router.use(express_2.default.json());
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = yield req.body;
        const isUser = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (isUser === null || isUser === void 0 ? void 0 : isUser.isVerified) {
            return res.status(200).json({ message: "User already exists! Please Login" });
        }
        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        if ((isUser === null || isUser === void 0 ? void 0 : isUser.isVerified) === false) {
            yield db_1.prisma.doctor.update({
                where: {
                    email
                },
                data: {
                    password: yield bcryptjs_1.default.hash(password, 10),
                    verifyCode
                }
            });
            return res.status(200).json({ message: "User already exists. Please Verify" });
        }
        const newUser = yield db_1.prisma.doctor.create({
            data: {
                email,
                password: yield bcryptjs_1.default.hash(password, 10),
                verifyCode,
                isVerified: false
            }
        });
        const emailResult = yield (0, VerificationMail_1.sendVerificationEmail)(email, verifyCode);
        if (emailResult.success) {
            return res.status(200).json({ message: "Verification code sent to email" });
        }
        return res.status(500).json({ message: "Failed to send verification code" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        const user = yield db_1.prisma.doctor.findUnique({
            where: { email }
        });
        if ((user === null || user === void 0 ? void 0 : user.verifyCode) === code) {
            yield db_1.prisma.doctor.update({
                where: { email },
                data: { isVerified: true }
            });
            return res.status(200).json({ message: "User verified successfully" });
        }
        return res.status(400).json({ message: "Invalid verification code" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = yield req.body;
        const user = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (!user) {
            return res.status(400).json({ message: "User not registered!" });
        }
        if (!user.isVerified) {
            return res.status(400).json({ message: "User not verified!" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password!" });
        }
        return res.status(200).json({ user, message: "Signin successful" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.get("/user/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const user = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            },
            include: {
                appointments: {
                    include: {
                        patient: true
                    }
                },
                history: {
                    include: {
                        patient: true
                    }
                },
                availableTimes: true,
                hospital: true
            }
        });
        if ((user === null || user === void 0 ? void 0 : user.name) == null) {
            return res.status(201).json({ message: "User not registered!" });
        }
        if (!user) {
            return res.status(201).json({ message: "User not registered!" });
        }
        return res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/user/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, phone, image, availableTimes } = yield req.body;
    try {
        const isUser = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (!isUser) {
            return res.status(400).json({ message: "User not registered!" });
        }
        const transaction = yield db_1.prisma.$transaction([
            db_1.prisma.timeSlot.deleteMany({
                where: {
                    doctorId: isUser.id
                }
            }),
            db_1.prisma.doctor.update({
                where: {
                    email
                },
                data: {
                    name,
                    phone,
                    image,
                    availableTimes: {
                        create: availableTimes.map((timeSlot) => ({
                            startTime: new Date(timeSlot.startTime),
                            endTime: new Date(timeSlot.endTime)
                        }))
                    }
                }
            })
        ]);
        return res.status(200).json({ message: "User updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/hospital/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, city, address, fee, availableDays, diseases, image, email, id } = yield req.body;
    try {
        const isUser = db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        console.log("id is", id);
        if (!isUser) {
            return res.status(400).json({ message: "User not registered!" });
        }
        if (id) {
            const isHospital = yield db_1.prisma.hospital.findUnique({
                where: {
                    id
                }
            });
            if (isHospital) {
                const updatedHospital = yield db_1.prisma.hospital.update({
                    where: {
                        id
                    },
                    data: {
                        name,
                        city,
                        address,
                        fee,
                        availableDays,
                        diseases,
                        image,
                    }
                });
                console.log("updated hospital is", updatedHospital);
                return res.status(200).json({ message: "Hospital created successfully" });
            }
        }
        const hospital = yield db_1.prisma.hospital.create({
            data: {
                name,
                city,
                address,
                fee,
                availableDays,
                diseases,
                image,
                doctor: {
                    connect: {
                        email
                    }
                }
            }
        });
        console.log("hospital is", hospital);
        if (!hospital) {
            return res.status(500).json({ message: "Failed to update hospital" });
        }
        return res.status(200).json({ message: "Hospital updated successfully", hospital });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post("/appointments/approve", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { appointmentId } = req.body;
    try {
        const appointment = yield db_1.prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });
        if (!appointment) {
            return res.status(400).json({ message: "Appointment not found" });
        }
        yield db_1.prisma.appointment.update({
            where: { id: appointmentId },
            data: { isApproved: true },
        });
        const doctor = yield db_1.prisma.doctor.findUnique({
            where: {
                id: appointment.doctorId
            }
        });
        const patient = yield db_1.prisma.patient.findUnique({
            where: {
                id: appointment.patientId
            }
        });
        const emailResult = yield (0, AppointmentAcceptedMail_1.sendAppointmentAcceptedMail)((patient === null || patient === void 0 ? void 0 : patient.email) || '', (patient === null || patient === void 0 ? void 0 : patient.name) || '', (doctor === null || doctor === void 0 ? void 0 : doctor.name) || '');
        return res.json({ message: "Appointment approved successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post("/appointments/reject", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { appointmentId } = req.body;
    try {
        const appointment = yield db_1.prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });
        if (!appointment) {
            return res.status(400).json({ message: "Appointment not found" });
        }
        const transaction = yield db_1.prisma.$transaction([
            db_1.prisma.history.create({
                data: {
                    appointmentDate: new Date(appointment.date),
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                },
            }),
            db_1.prisma.appointment.delete({
                where: { id: appointmentId },
            })
        ]);
        const doctor = yield db_1.prisma.doctor.findUnique({
            where: {
                id: appointment.doctorId
            }
        });
        const patient = yield db_1.prisma.patient.findUnique({
            where: {
                id: appointment.patientId
            }
        });
        const emailResult = yield (0, AppointmentRejected_1.sendAppointmentRejectedMail)((patient === null || patient === void 0 ? void 0 : patient.email) || '', (patient === null || patient === void 0 ? void 0 : patient.name) || '', (doctor === null || doctor === void 0 ? void 0 : doctor.name) || '');
        if (!transaction) {
            return res.status(400).json({ message: "Failed to delete appointment" });
        }
        return res.json({ message: "Appointment deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post("/appointments/completed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { appointmentId } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ message: "Appointment ID is required" });
    }
    try {
        const appointment = yield db_1.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        const transaction = yield db_1.prisma.$transaction([
            db_1.prisma.appointment.update({
                where: { id: appointmentId },
                data: { isApproved: true },
            }),
            db_1.prisma.history.create({
                data: {
                    appointmentDate: new Date(appointment.date),
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                },
            }),
            db_1.prisma.appointment.delete({
                where: { id: appointmentId },
            }),
        ]);
        if (!transaction) {
            return res.status(400).json({ message: "Failed to update history" });
        }
        const doctor = yield db_1.prisma.doctor.findUnique({
            where: {
                id: appointment.doctorId
            }
        });
        const patient = yield db_1.prisma.patient.findUnique({
            where: {
                id: appointment.patientId
            }
        });
        const emailResult = yield (0, AppointmentSuccess_1.sendAppointmentSuccessMail)((patient === null || patient === void 0 ? void 0 : patient.email) || '', (patient === null || patient === void 0 ? void 0 : patient.name) || '', (doctor === null || doctor === void 0 ? void 0 : doctor.name) || '');
        return res.json({ message: "History updated successfully" });
    }
    catch (error) {
        console.error("Error pushing history:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/reset/email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield db_1.prisma.doctor.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        yield db_1.prisma.doctor.update({
            where: { email },
            data: { verifyCode }
        });
        const emailResult = yield (0, VerificationMail_1.sendVerificationEmail)(email, verifyCode);
        if (emailResult.success) {
            return res.status(200).json({ message: "Verification code sent to email" });
        }
        return res.status(500).json({ message: "Failed to send verification code" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/reset/code', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, code } = req.body;
    try {
        const user = yield db_1.prisma.doctor.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.verifyCode === code) {
            return res.status(200).json({ message: "Verification code is correct" });
        }
        return res.status(400).json({ message: "Invalid verification code" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/reset/password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield db_1.prisma.doctor.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield db_1.prisma.doctor.update({
            where: { email },
            data: { password: hashedPassword }
        });
        return res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;

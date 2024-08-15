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
const sendVerificationMail_1 = require("../helpers/sendVerificationMail");
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
        console.log(email, password);
        const emailResult = yield (0, sendVerificationMail_1.sendVerificationEmail)(email, verifyCode);
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
            console.log("User verified");
            return res.status(200).json({ message: "User verified successfully" });
        }
        console.log("Invalid code");
        return res.status(400).json({ message: "Invalid verification code" });
    }
    catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = yield req.body;
        console.log(email, password);
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
        console.log(email);
        const user = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            },
            include: {
                appointments: true,
                history: true,
                availableTimes: true,
                hospital: true
            }
        });
        if ((user === null || user === void 0 ? void 0 : user.name) == null) {
            return res.status(201).json({ message: "User not registered!" });
        }
        console.log(user);
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
    console.log(email, name, phone, image, availableTimes);
    try {
        const isUser = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (!isUser) {
            return res.status(400).json({ message: "User not registered!" });
        }
        const user = yield db_1.prisma.doctor.update({
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
        });
        return res.status(200).json({ message: "User updated successfully", user });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.post('/hospital/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, city, address, fee, availableDays, diseases, image, email } = yield req.body;
    console.log(name, email, city, address, fee, availableDays, diseases, image);
    try {
        const isUSer = db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (!isUSer) {
            return res.status(400).json({ message: "User not registered!" });
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
        if (!hospital) {
            return res.status(500).json({ message: "Failed to update hospital" });
        }
        return res.status(200).json({ message: "Hospital updated successfully", hospital });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// router.post("/user/create/:email", async (req: Request, res: Response) => {
//   try {
//     const { email } = req.params;
//     const {
//       name,
//       hospital,
//       city,
//       address,
//       profile,
//       phone,
//       fee,
//       availableDays,
//       availableTimes, // Expecting this to be an array of { startTime, endTime }
//       diseases
//     } = req.body;
//     // Log the payload for debugging
//     console.log("Received payload:", req.body);
//     // Example payload validation (expand as needed)
//     if (!name || !hospital || !city || !address || !profile || !phone || !fee || !availableDays || !availableTimes || !diseases) {
//       console.log("Missing required fields in payload:", req.body);
//       return res.status(400).json({ message: "Missing required fields" });
//     }
//     // Check if user already exists
//     const existingUser = await prisma.doctor.findUnique({
//       where: {
//         email
//       }
//     });
//     if (existingUser) {
//       console.log("User already exists:", email);
//       return res.status(409).json({ message: "User already exists" });
//     }
//     // Create new user with nested TimeSlot creation
//     const newUser = await prisma.doctor.create({
//       data: {
//         email,
//         name,
//         hospital,
//         city,
//         address,
//         profile,
//         phone,
//         fee,
//         availableDays,
//         diseases,
//         availableTimes: {
//           create: availableTimes.map((timeSlot: { startTime: Date, endTime: Date }) => ({
//             startTime: new Date(timeSlot.startTime),
//             endTime: new Date(timeSlot.endTime)
//           }))
//         }
//       }
//     });
//     console.log("New user created:", newUser);
//     return res.json({ message: "User Created", user: newUser });
//   } catch (error : any) {
//     console.error("Error creating user:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// });
exports.default = router;

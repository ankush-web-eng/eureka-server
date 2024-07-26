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
const router = (0, express_1.Router)();
router.use(express_2.default.json());
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
                history: true
            }
        });
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
router.post("/user/create/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const { name, hospital, city, address, profile, phone, fee, availableDays, availableTimes, // Expecting this to be an array of { startTime, endTime }
        diseases } = req.body;
        // Log the payload for debugging
        console.log("Received payload:", req.body);
        // Example payload validation (expand as needed)
        if (!name || !hospital || !city || !address || !profile || !phone || !fee || !availableDays || !availableTimes || !diseases) {
            console.log("Missing required fields in payload:", req.body);
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if user already exists
        const existingUser = yield db_1.prisma.doctor.findUnique({
            where: {
                email
            }
        });
        if (existingUser) {
            console.log("User already exists:", email);
            return res.status(409).json({ message: "User already exists" });
        }
        // Create new user with nested TimeSlot creation
        const newUser = yield db_1.prisma.doctor.create({
            data: {
                email,
                name,
                hospital,
                city,
                address,
                profile,
                phone,
                fee,
                availableDays,
                diseases,
                availableTimes: {
                    create: availableTimes.map((timeSlot) => ({
                        startTime: new Date(timeSlot.startTime),
                        endTime: new Date(timeSlot.endTime)
                    }))
                }
            }
        });
        console.log("New user created:", newUser);
        return res.json({ message: "User Created", user: newUser });
    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}));
exports.default = router;

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
        const payload = req.body;
        const isUser = yield db_1.prisma.doctor.findUnique({
            where: {
                email: req.params.email
            }
        });
        if (isUser) {
            return res.status(200).json({ message: "User already exists!" });
        }
        const user = yield db_1.prisma.doctor.create({
            data: Object.assign({}, payload)
        });
        console.log("User Created Successfully!!");
        if (!user) {
            return res.status(400).json({ message: "User not registered!" });
        }
        return res.json({ message: "User Created" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// router.post('/slots/create', async (req: Request, res: Response) => {
//   try {
//     const { date, doctorId } = req.body;
//     if (!date || !doctorId) {
//       return res.status(400).json({ message: "Date and Doctor ID are required" });
//     }
//     const slotDate = new Date(date);
//     // Check if the slot already exists
//     const existingSlot = await prisma.slot.findFirst({
//       where: {
//         date: slotDate,
//         doctorId: doctorId,
//       },
//     });
//     if (existingSlot) {
//       return res.status(400).json({ message: "Slot already exists for the given time" });
//     }
//     // Create the new slot
//     const slot = await prisma.slot.create({
//       data: {
//         date: slotDate,
//         doctor: {
//           connect: {
//             id: doctorId,
//           },
//         },
//       },
//     });
//     if (!slot) {
//       return res.status(400).json({ message: "Slot not created!" });
//     }
//     return res.json({ message: "Slot Created", slot });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });
// router.get('/slots/:doctorId', async (req: Request, res: Response) => {
//   try {
//     const doctorId = req.params.doctorId;
//     const doctor = await prisma.doctor.findUnique({
//       where: {
//         id: doctorId,
//       },
//     });
//     if (!doctor) {
//       return res.status(400).json({ message: "Doctor not found!" })
//     }
//     const slots = await prisma.slot.findMany({
//       where: {
//         doctorId: doctorId,
//       },
//     });
//     if (!slots) {
//       return res.status(400).json({ message: "Slots not found!" })
//     }
//     return res.json(slots);
//   } catch (error) {
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// })
exports.default = router;

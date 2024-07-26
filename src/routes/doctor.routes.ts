import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'
import expres from 'express'

const router = Router();
router.use(expres.json())

router.get("/user/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params
    console.log(email)
    const user = await prisma.doctor.findUnique({
      where: {
        email
      },
      include: {
        appointments: true,
        history: true
      }
    })
    console.log(user)
    if (!user) {
      return res.status(201).json({ message: "User not registered!" })
    }
    return res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post("/user/create/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const {
      name,
      hospital,
      city,
      address,
      profile,
      phone,
      fee,
      availableDays,
      availableTimes, // Expecting this to be an array of { startTime, endTime }
      diseases
    } = req.body;

    // Log the payload for debugging
    console.log("Received payload:", req.body);

    // Example payload validation (expand as needed)
    if (!name || !hospital || !city || !address || !profile || !phone || !fee || !availableDays || !availableTimes || !diseases) {
      console.log("Missing required fields in payload:", req.body);
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await prisma.doctor.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(409).json({ message: "User already exists" });
    }

    // Create new user with nested TimeSlot creation
    const newUser = await prisma.doctor.create({
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
          create: availableTimes.map((timeSlot: { startTime: Date, endTime: Date }) => ({
            startTime: new Date(timeSlot.startTime),
            endTime: new Date(timeSlot.endTime)
          }))
        }
      }
    });

    console.log("New user created:", newUser);
    return res.json({ message: "User Created", user: newUser });
  } catch (error : any) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;

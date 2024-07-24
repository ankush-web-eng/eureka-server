import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'

const router = Router();

router.get("/user/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email
    console.log(email)
    const user = await prisma.doctor.findUnique({
      where: {
        email
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
    const payload = req.body
    const isUser = await prisma.doctor.findUnique({
      where: {
        email: req.params.email
      }
    })
    if (isUser) {
      return res.status(200).json({ message: "User already exists!" })
    }
    const user = await prisma.doctor.create({
      data: {
        ...payload
      }
    })
    console.log("User Created Successfully!!")
    if (!user) {
      return res.status(400).json({ message: "User not registered!" })
    }
    return res.json({ message: "User Created" })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post('/slots/create', async (req: Request, res: Response) => {
  try {
    const { date, doctorId } = req.body;

    if (!date || !doctorId) {
      return res.status(400).json({ message: "Date and Doctor ID are required" });
    }

    const slotDate = new Date(date);

    // Check if the slot already exists
    const existingSlot = await prisma.slot.findFirst({
      where: {
        date: slotDate,
        doctorId: doctorId,
      },
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already exists for the given time" });
    }

    // Create the new slot
    const slot = await prisma.slot.create({
      data: {
        date: slotDate,
        doctor: {
          connect: {
            id: doctorId,
          },
        },
      },
    });

    if (!slot) {
      return res.status(400).json({ message: "Slot not created!" });
    }

    return res.json({ message: "Slot Created", slot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/slots/:doctorId', async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
      },
    });

    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found!" })
    }

    const slots = await prisma.slot.findMany({
      where: {
        doctorId: doctorId,
      },
    });

    if (!slots) {
      return res.status(400).json({ message: "Slots not found!" })
    }

    return res.json(slots);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
})

export default router;

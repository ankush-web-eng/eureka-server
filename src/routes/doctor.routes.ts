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
      return res.status(404).json({ message: "User not found" })
    }
    return res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

export default router;

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


export default router;

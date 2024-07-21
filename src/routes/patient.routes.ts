import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db'

const router = Router();

router.get("/user/:email", async (req : Request, res : Response) => {
    try {
        const email = req.params.email
        console.log(email)
        const user = await prisma.patient.findUnique({
            where: {
                email
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(user)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post("/user/create/:email", async (req : Request, res : Response) => {
    try {
        const email = req.params.email
        const city = req.body.city
        console.log(email, city)
        const user = await prisma.patient.create({
            data: {
                email,
                city
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User Creation failed" })
        }
        return res.json(user)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

export default router;

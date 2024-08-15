import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import expres from 'express';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../helpers/sendVerificationMail';

const router = Router();
router.use(expres.json())

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body

    const isUser = await prisma.doctor.findUnique({
      where: {
        email
      }
    })

    if (isUser?.isVerified) {
      return res.status(200).json({ message: "User already exists! Please Login" })
    }

    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (isUser?.isVerified === false) {
      await prisma.doctor.update({
        where: {
          email
        },
        data: {
          password: await bcrypt.hash(password, 10),
          verifyCode
        }
      })

      return res.status(200).json({ message: "User already exists. Please Verify" })
    }

    const newUser = await prisma.doctor.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        verifyCode,
        isVerified: false
      }
    })

    console.log(email, password)
    const emailResult = await sendVerificationEmail(email, verifyCode);
    if (emailResult.success) {
      return res.status(200).json({ message: "Verification code sent to email" });
    }

    return res.status(500).json({ message: "Failed to send verification code" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.doctor.findUnique({
      where: { email }
    });

    if (user?.verifyCode === code) {
      await prisma.doctor.update({
        where: { email },
        data: { isVerified: true }
      });

      console.log("User verified");
      return res.status(200).json({ message: "User verified successfully" });
    }

    console.log("Invalid code");
    return res.status(400).json({ message: "Invalid verification code" });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;
    console.log(email, password);

    const user = await prisma.doctor.findUnique({
      where: {
        email
      }
    })

    if (!user) {
      return res.status(400).json({ message: "User not registered!" })
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "User not verified!" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password!" })
    }

    return res.status(200).json({ user, message: "Signin successful" })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
});

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
        history: true,
        availableTimes: true,
        hospital: true
      }
    })

    if (user?.name == null) {
      return res.status(201).json({ message: "User not registered!" })
    }
    console.log(user)
    if (!user) {
      return res.status(201).json({ message: "User not registered!" })
    }
    return res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
});

router.post('/user/update', async (req: Request, res: Response) => {
  const { email, name, phone, image, availableTimes } = await req.body
  console.log(email, name, phone, image, availableTimes)
  try {

    const isUser = await prisma.doctor.findUnique({
      where: {
        email
      }
    })

    if (!isUser) {
      return res.status(400).json({ message: "User not registered!" })
    }

    const user = await prisma.doctor.update({
      where: {
        email
      },
      data: {
        name,
        phone,
        image,
        availableTimes: {
          create: availableTimes.map((timeSlot: { startTime: Date, endTime: Date }) => ({
            startTime: new Date(timeSlot.startTime),
            endTime: new Date(timeSlot.endTime)
          }))
        }
      }
    })

    return res.status(200).json({ message: "User updated successfully", user })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post('/hospital/update', async (req: Request, res: Response) => {
  const { name, city, address, fee, availableDays, diseases, image, email } = await req.body
  console.log(name, email, city, address, fee, availableDays, diseases, image)
  try {
    const isUSer = prisma.doctor.findUnique({
      where: {
        email
      }
    })

    if (!isUSer) {
      return res.status(400).json({ message: "User not registered!" })
    }

    const hospital = await prisma.hospital.create({
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
    })

    if (!hospital) {
      return res.status(500).json({ message: "Failed to update hospital" })
    }

    return res.status(200).json({ message: "Hospital updated successfully", hospital })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})


export default router;

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import expres from 'express';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../helpers/sendVerificationMail';

const router = Router();
router.use(expres.json())

router.post('/signup', async(req : Request,res : Response) => {
  try {
    const { email, password } = await req.body
    
    const isUser = await prisma.doctor.findUnique({
      where: {
        email
      }
    })
    
    if(isUser?.isVerified){
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
      data : {
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

router.post('/verify', async(req : Request,res : Response) => {
  try {
    const { email, code } = req.body;

    console.log("Email:", email);
    console.log("Code:", code);

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


router.post('/signin', async(req : Request,res : Response) => {
  try {
    const { email, password } = await req.body;
    console.log(email,password);

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

    return res.status(200).json({user, message: "Signin successful" })

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
    console.log(user)
    if (!user) {
      return res.status(201).json({ message: "User not registered!" })
    }
    return res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
});

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

export default router;

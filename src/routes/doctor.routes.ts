import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import express from 'express';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from "../emails/VerificationMail"
import { sendAppointmentAcceptedMail } from '../emails/AppointmentAcceptedMail';
import { sendAppointmentRejectedMail } from '../emails/AppointmentRejected';
import { sendAppointmentSuccessMail } from '../emails/AppointmentSuccess';

const router = Router();
router.use(express.json())

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

      return res.status(200).json({ message: "User verified successfully" });
    }

    return res.status(400).json({ message: "Invalid verification code" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;

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
    const user = await prisma.doctor.findUnique({
      where: {
        email
      },
      include: {
        appointments: {
          include: {
            patient: true
          }
        },
        history: {
          include: {
            patient: true
          }
        },
        availableTimes: true,
        hospital: true
      }
    })

    if (user?.name == null) {
      return res.status(201).json({ message: "User not registered!" })
    }
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
  try {

    const isUser = await prisma.doctor.findUnique({
      where: {
        email
      }
    })

    if (!isUser) {
      return res.status(400).json({ message: "User not registered!" })
    }

    const transaction = await prisma.$transaction([
      prisma.timeSlot.deleteMany({
        where: {
          doctorId: isUser.id
        }
      }),

      prisma.doctor.update({
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
    ])

    return res.status(200).json({ message: "User updated successfully" })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post('/hospital/create', async (req: Request, res: Response) => {
  const { name, city, address, fee, availableDays, diseases, image, email, id } = await req.body
  try {
    const isUser = prisma.doctor.findUnique({
      where: {
        email
      }
    });

    if (!isUser) {
      return res.status(400).json({ message: "User not registered!" })
    }

    if (id) {
      const isHospital = await prisma.hospital.findUnique({
        where: {
          id
        }
      });

      if (isHospital) {
        const updatedHospital = await prisma.hospital.update({
          where: {
            id
          },
          data: {
            name,
            city,
            address,
            fee,
            availableDays,
            diseases,
            image,
          }
        })
        return res.status(200).json({ message: "Hospital created successfully" });
      }
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
    });

    if (!hospital) {
      return res.status(500).json({ message: "Failed to update hospital" });
    }

    return res.status(200).json({ message: "Hospital updated successfully", hospital });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
})

router.post("/appointments/approve", async (req: Request, res: Response) => {
  const { appointmentId } = req.body
  try {
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId
      }
    })

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" })
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { isApproved: true },
    });

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: appointment.doctorId
      }
    })

    const patient = await prisma.patient.findUnique({
      where: {
        id: appointment.patientId
      }
    })

    const emailResult = await sendAppointmentAcceptedMail(patient?.email || '', patient?.name || '', doctor?.name || '');

    return res.json({ message: "Appointment approved successfully" })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.post("/appointments/reject", async (req: Request, res: Response) => {
  const { appointmentId } = req.body
  try {
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId
      }
    })

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" })
    }

    const transaction = await prisma.$transaction([
      prisma.history.create({
        data: {
          appointmentDate: new Date(appointment.date),
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
        },
      }),

      prisma.appointment.delete({
        where: { id: appointmentId },
      })
    ])

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: appointment.doctorId
      }
    })

    const patient = await prisma.patient.findUnique({
      where: {
        id: appointment.patientId
      }
    })

    const emailResult = await sendAppointmentRejectedMail(patient?.email || '', patient?.name || '', doctor?.name || '');

    if (!transaction) {
      return res.status(400).json({ message: "Failed to delete appointment" })
    }

    return res.json({ message: "Appointment deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})


router.post("/appointments/completed", async (req: Request, res: Response) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ message: "Appointment ID is required" });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const transaction = await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { isApproved: true },
      }),

      prisma.history.create({
        data: {
          appointmentDate: new Date(appointment.date),
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
        },
      }),

      prisma.appointment.delete({
        where: { id: appointmentId },
      }),
    ]);

    if (!transaction) {
      return res.status(400).json({ message: "Failed to update history" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: appointment.doctorId
      }
    })

    const patient = await prisma.patient.findUnique({
      where: {
        id: appointment.patientId
      }
    })

    const emailResult = await sendAppointmentSuccessMail(patient?.email || '', patient?.name || '', doctor?.name || '');

    return res.json({ message: "History updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/reset/email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.doctor.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.doctor.update({
      where: { email },
      data: { verifyCode }
    });

    const emailResult = await sendVerificationEmail(email, verifyCode);

    if (emailResult.success) {
      return res.status(200).json({ message: "Verification code sent to email" });
    }

    return res.status(500).json({ message: "Failed to send verification code" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/reset/code', async (req: Request, res: Response) => {
  const { email, code } = req.body;

  try {
    const user = await prisma.doctor.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.verifyCode === code) {
      return res.status(200).json({ message: "Verification code is correct" });
    }

    return res.status(400).json({ message: "Invalid verification code" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/reset/password', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.doctor.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.doctor.update({
      where: { email },
      data: { password: hashedPassword }
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;

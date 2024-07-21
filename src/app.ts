import express, { Application } from 'express';
import doctorRoutes from './routes/doctor.routes';
import patientRoutes from './routes/patient.routes';
import cors from 'cors'

const app: Application = express();

app.use(express.json());
app.use(cors())

app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);

export default app;

import express, { Application } from 'express';
import doctorRoutes from './routes/doctor.routes';
import patientRoutes from './routes/patient.routes';
import v1Routes from './routes/v1.routes';
import cors from 'cors'
const app: Application = express();

app.use(express.json());
app.use(cors({
    origin : "*"
}))

app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);
app.use('/v1',v1Routes)


export default app;
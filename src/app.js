
import express from 'express';
import cors from 'cors';
import { errorHandler, AppError } from './middlewares/errorHandler.js';
import authRoute from '../src/modules/auth/auth.routes.js';
import staffRoute from '../src/modules/staff/staff.routes.js';
import { prisma } from '../src/config/database.js';



const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'Success',
        message: 'PakTrack Core Operational Engine is running optimally.',
        timestamp: new Date().toDateString()
    });
});

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/staff', staffRoute);

app.get('/api/v1/debug-error', (req, res, next) => {
    return next(new AppError(403, 'ACCESS_DENIED', 'Security boundary exception: Access denied'));
});

app.all('/*any', (req, res, next) => {
    return next(new AppError(404, 'ROUTE_NOT_FOUND', `The requested route path [${req.originalUrl}] does not exist.`));
});

app.use(errorHandler);

export default app;
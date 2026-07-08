import * as authService from './auth.service.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/database.js';
import { loginSchema, registerSchema } from './auth.validator.js';


export const registerAgency = async (req, res, next) => {
    try {
        // console.log(req.body);
        const payload = registerSchema.safeParse(req.body);
        if(!payload.success){
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }
        // console.log(payload)
        const serviceResult = await authService.createRegisterAgency(payload.data);

        return res.status(201).json({
            status: 'success',
            message: 'Travel agency and corporate administration profile onboarded successfully.',
            data: serviceResult,
        });

    } catch (error) {                    
        // ← Fixed: consistent variable name
        console.error('Registration Error:', error);
    return next(error);              
    }
};

export const loginUser = async (req, res, next) => {

    try {
        const payload = loginSchema.safeParse(req.body);
        if(!payload.success){
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                payload.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            )
        }

        const authenticationData = await authService.agencyLogin(payload.data);

        return res.status(200).json({
            success: true,
            message: 'Authentication handshake successful.',
            data: authenticationData,
        });

    } catch (error) {
        console.error('Login Error:', error);
        return next(error);
    }
};
import * as authService from './auth.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../config/db.js';

export const registerAgency = async (req, res, next) => {
    try {
         if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(401).json({
                message: "input required"
            })
            }
        const { agencyName, subdomain, email, password } = req.body;

        const serviceResult = await authService.createAgencyAccount({
            agencyName,
            subdomain,
            email,
            password,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Travel agency and corporate administration profile onboarded successfully.',
            data: serviceResult,
        });

    } catch (error) {                    
        // ← Fixed: consistent variable name
        console.error('Registration Error:', error);

        if (error instanceof authService.BusinessError) {
            return next(new AppError(error.statusCode, error.code, error.message));
        }

        return next(error);              // Let global error handler deal with it
    }
};

export const loginUser = async (req, res, next) => {
    try {
        if(!req.body || object.keys(req.body).length === 0){
            return res.status(400).json({
                message: "Input Required"
            })
        }

        const { email, password } = req.body;

        const authenticationData = await authService.authenticateUser({ email, password });

        return res.status(200).json({
            status: 'success',
            message: 'Authentication handshake successful.',
            data: authenticationData,
        });

    } catch (error) {
        console.error('Login Error:', error);

        if (error instanceof authService.BusinessError) {
            return next(new AppError(error.statusCode, error.code, error.message));
        }

        return next(error);
    }
};
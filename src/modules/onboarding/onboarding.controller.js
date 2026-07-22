// import * as onboardingService from "./onboarding.service.js";
// import { AppError } from "../../middlewares/errorHandler.js";
// import { validateInvitationSchema, createPasswordSchema } from "./onboarding.validator.js";
// import { file, success } from "zod";


// //validate invitation
// export const validateInvitation = async (req, res, next) => {
//     try {
//         const payload = validateInvitationSchema.safeParse(req.params);
//         if(!payload.success){
//             throw new AppError(
//                 400,
//                 "VALIDATION_ERROR",
//                 payload.error.issues.map((issue) => ({
//                     field: issue.path.join("."),
//                     message: issue.message
//                 }))
//             );
//             }
//         const result = await onboardingService.validateInvitation(payload.data);
    
//         return res.status(200).json({
//             success: true,
//             message: "Invitation is valid. ",
//             data: result,
//         });
//     }catch(error){
//         next(error);
//     }


// };


// //create password
// export const createPassword = async (req,res, next) => {
//     try{
//         const payload = createPasswordSchema.safeParse(req.body);
//         if(!payload.success){
//             throw new AppError(
//                 400,
//                 "VALIDATION_ERROR",
//                 payload.error.issues.map((issue) => ({
//                     field: issue.path.join("."),
//                     message: issue.message,
//                 }))
//             );
//         }
//         const result = await onboardingService.createPassword(payload.data);
        
//         return res.status(200).json({
//             success: true,
//             message: "Account activated successfully.",
//             data: result,
//         });
//     }catch(error){
//         next(error);
//     }
    
// };
import express from "express";
import * as staffController from "./staff.controller.js";
import { authenticate, authorize, preVerifyRefreshToken } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { loginLimiter, refreshLimiter, apiLimiter, forgotPasswordLimiter, resetPasswordLimiter } from "../../middlewares/rateLimiter.js";
const router = express.Router();

//staff
router.post(
    "/",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.createStaff
);

router.post(
    "/login", 
    loginLimiter,
    staffController.staffLogin,
);

router.post("/refresh",preVerifyRefreshToken, refreshLimiter, staffController.refreshToken);

router.use(authenticate, apiLimiter);

router.post(
    "/change-password",
    authenticate,
    authorize(ROLES.DESK_AGENT),
    staffController.changePassword
);

//get all staff
router.get(
    "/",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.getAllStaff
);


router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    staffController.forgetPassword
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    staffController.resetPassword
);

//Activate / Deactivate staff 
router.patch(
    "/:id/status",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.updateStaffStatus
);


router.patch(
    "/:id/deactivate",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.deactivateDeskAgent
);




router.post(
    "/logout",
    staffController.logout
);


export default router;
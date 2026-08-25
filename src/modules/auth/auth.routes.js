import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate, preVerifyRefreshToken} from "../../middlewares/auth.middleware.js";
import { loginLimiter, refreshLimiter, apiLimiter, forgotPasswordLimiter, resetPasswordLimiter } from "../../middlewares/rateLimiter.js";
const router = Router();

router.post("/register", authController.registerAgency);
router.post("/login", loginLimiter, authController.loginUser);



router.post(
    "/logout",
    authController.logout
);

router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    authController.forgetPassword
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    authController.resetPassword
);
router.post("/refresh", preVerifyRefreshToken, refreshLimiter, authController.refreshToken);

router.use(authenticate, apiLimiter);
router.post("/change-password",authenticate, authController.changePassword);
router.post("/me", authenticate, authController.getCurrentUser);

export default router;

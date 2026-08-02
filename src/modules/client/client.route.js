import { Router } from "express";

import * as clientController from "./client.controller.js";

import { authenticate, authorize, preVerifyRefreshToken } from "../../middlewares/auth.middleware.js";

import { ROLES } from "../../modules/constants/roles.js";
import { loginLimiter, refreshLimiter, apiLimiter, forgotPasswordLimiter, resetPasswordLimiter} from "../../middlewares/rateLimiter.js";
const router = Router();

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.AGENCY_ADMIN,
    ROLES.DESK_AGENT
  ),
  clientController.createClient
);
router.post(
  "/login",
  loginLimiter,
  clientController.clientLogin
);
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    clientController.forgetPassword
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    clientController.resetPassword

  );
router.use(authenticate, apiLimiter);

router.post(
    "/logout",
    clientController.logout
);





router.post("/refresh", preVerifyRefreshToken, refreshLimiter, clientController.refreshToken);

router.post("/change-password",authenticate,authorize(ROLES.TRAVELLER),clientController.changePassword
);

export default router;
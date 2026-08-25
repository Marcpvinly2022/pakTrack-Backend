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
  "/:clientId/applications",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
  clientController.createApplication
);


router.get(
  "/",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
  clientController.getClients
);

router.get(
  "/:clientId",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
  clientController.getClientById
);

router.patch(
  "/:clientId/assignment",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN),          // ← admin only
  clientController.reassignClient
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

router.post("/change-password",authenticate,clientController.changePassword
);

router.post(
    "/reset-password",
    resetPasswordLimiter,
    clientController.resetPassword

  );


router.post("/refresh", preVerifyRefreshToken, refreshLimiter, clientController.refreshToken);  
router.use(authenticate, apiLimiter);

router.post(
    "/logout",
    clientController.logout
);

export default router;
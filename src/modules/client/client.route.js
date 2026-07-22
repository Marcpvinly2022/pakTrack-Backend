import { Router } from "express";

import * as clientController from "./client.controller.js";

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

import { ROLES } from "../../modules/constants/roles.js";

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
  clientController.clientLogin
);


router.post("/change-password",authenticate,authorize(ROLES.TRAVELLER),clientController.changePassword
);

export default router;
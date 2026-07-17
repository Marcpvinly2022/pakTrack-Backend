import { Router } from "express";

import * as clientController from "./client.controller.js";

import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

import { ROLES } from "../../modules/constants/roles.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Client Registration
|--------------------------------------------------------------------------
|
| Agency Admin
| Desk Agent
|
*/

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.AGENCY_ADMIN,
    ROLES.DESK_AGENT
  ),
  clientController.createClient
);

export default router;
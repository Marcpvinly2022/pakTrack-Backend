import {Router} from "express";
import * as Services from "./service.controller.js";

import { authorize, authenticate} from "../../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";


const router = Router();

router.post(
    '/',
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    Services.createServiceController
);

export default router;


router.get(
  "/",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
  Services.getServicesController,
);


router.patch(
  "/:serviceId",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN),
  Services.updateServiceController,
);

router.patch(
  "/:serviceId/restore",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN),
  Services.restoreServiceController,
);

router.delete(
  "/:serviceId",
  authenticate,
  authorize(ROLES.AGENCY_ADMIN),
  Services.deleteServiceController,
);
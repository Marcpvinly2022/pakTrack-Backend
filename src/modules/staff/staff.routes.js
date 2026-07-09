import express from "express";
import * as staffController from "./staff.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

//staff
router.post(
    "/",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.createStaff
);

//get all staff
router.get(
    "/",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.getAllStaff
);

//Activate / Deactivate staff 
router.patch(
    "/:id/status",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    staffController.updateStaffStatus
);

export default router;
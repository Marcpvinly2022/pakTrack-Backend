import { Router } from "express";
import * as DocumentController  from "./document.controller.js";
import { authenticate, authorize} from "../../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";

// Mounted at /api/v1/applications
export const applicationDocumentRouter = Router();

// Staff build the per-case checklist
applicationDocumentRouter.post(
    "/:applicationId/document-requirements",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
    DocumentController.createRequirementController
);

applicationDocumentRouter.get(
    "/:applicationId/document-requirements",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
    DocumentController.listRequirementsController,
);


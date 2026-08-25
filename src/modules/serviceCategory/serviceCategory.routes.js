import {Router} from "express";
import * as serviceCategoryController from "./serviceCategory.controller.js";
import {authenticate, authorize} from "../../middlewares/auth.middleware.js";
import {ROLES} from "../constants/roles.js";


const router = Router();

router.post(
    "/",
    authenticate,
    authorize(
        ROLES.AGENCY_ADMIN
    ),
    serviceCategoryController.create

);

router.get(
    "/",
    authenticate,
    authorize(
        ROLES.AGENCY_ADMIN,
        ROLES.DESK_AGENT
    ),
    serviceCategoryController.getAllCategory
);


router.get(
    "/:id",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN, ROLES.DESK_AGENT),
    serviceCategoryController.getServiceCategoryById
);

router.patch(
    "/:id",
    authenticate,
    authorize(
        ROLES.AGENCY_ADMIN
    ),
    serviceCategoryController.updateServiceCategory

);

router.delete(
    "/:categoryId",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    serviceCategoryController.deleteCategory
);


router.patch(
    "/:categoryId/restore",
    authenticate,
    authorize(ROLES.AGENCY_ADMIN),
    serviceCategoryController.restoreServiceCategory
);

export default router;
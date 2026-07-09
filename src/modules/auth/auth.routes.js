import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", authController.registerAgency);
router.post("/login", authController.loginUser);

router.post("/me", authenticate, authController.getCurrentUser);

export default router;

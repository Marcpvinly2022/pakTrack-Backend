import * as categoryService from "./serviceCategory.service.js";
import * as ValidateServiceSchema from "./serviceCategory.validator.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import asyncHandler from 'express-async-handler';

/**
 * Production-Hardened Service Category Controller
 */
export const create = async (req, res, next) => {
  try {
    // Enforce safe body extraction safeguards early
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Request request body context cannot be empty.",
      );
    }

    const payload = ValidateServiceSchema.createServiceCategorySchema.safeParse(
      req.body,
    );

    // ✅ SECURITY SHIELD: Robust, anti-crash Zod validation checker
    if (!payload.success) {
      const formattedErrors = payload.error?.issues
        ? payload.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }))
        : [
            {
              field: "body",
              message: "Invalid schema payload variables provided.",
            },
          ];

      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Validation failed.",
        formattedErrors,
      );
    }

    // ✅ REPAIR SUITE: Execute the service pipeline with isolated actor parameters
    const category = await categoryService.createServiceCategory({
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      actorType: req.user.type || "USER", // Maps identity safely without key duplication
      data: payload.data,
    });

    return successResponse(
      res,
      201, // 201 Created matches a newly persisted entity row perfectly
      "Service category created successfully.",
      category,
    );
  } catch (error) {
    // Securely catch any operational failures and pass them to your central errorHandler.js file
    return next(error);
  }
};

export const getAllCategory = async (req, res, next) => {
  try {
    const categories = await categoryService.getServiceCategory(
      req.user.tenantId,
    );

    return successResponse(
      res,
      200,
      "Service categories retrieved successfully.",
      categories,
    );
  } catch (error) {
    next(error);
  }
};


export const getServiceCategoryById = asyncHandler(async (req, res) => {

    const category = await categoryService.getServiceCategoryById({
        tenantId: req.user.tenantId,
        categoryId: req.params.id,
    });

    successResponse(
        res,
        200,
        "Service category retrieved successfully.",
        category
    );

});

export const updateServiceCategory = async (req, res, next) => {
  try {
    
    const payload = ValidateServiceSchema.updateServiceCategorySchema.safeParse(req.body);
    
    if (!payload.success) {
      const formattedErrors = payload.error?.issues
        ? payload.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }))
        : [
            {
              field: "body",
              message: "Invalid schema payload variables provided.",
            },
          ];

      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Validation failed.",
        formattedErrors,
      );
    }

    const updateCategory = await categoryService.updateServiceCategory({
      categoryId: req.params.id,
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      actorType: req.user.type || "USER",
      data: payload.data,
  });

    return successResponse(
      res,
      200,
      "Service category updated successfully.",
      updateCategory,
    );
  } catch (error) {
    next(error)
  }
};


export const deleteCategory = async (req, res, next) => { // Added 'next' here
    try {
        const tenantId = req.user.tenantId;
        const actorId = req.user.id;
        const actorType = req.user.role;

        // Extract categoryId from route params
        const { categoryId } = req.params;

        const categoryData = await categoryService.deleteServiceCategory({
            tenantId,
            categoryId,
            actorId,
            actorType,
            // 🚀 FIXED: Removed the stray "serviceId" line from here
        });

        return successResponse(
            res, 
            200,
            "Category deleted successfully!",
            categoryData,
        );

    } catch (error) {
        console.error("🔥 DELETE CATEGORY ERROR:", error);
        console.error("🔥 STACK:", error?.stack);
        next(error); // This will now execute safely
    }
};



export const restoreServiceCategory = async(req, res, next) => {
    try{
    const tenantId = req.user.tenantId;
    const actorId = req.user.id;
    const actorType = req.user.role;
    const {categoryId} = req.params;

    const result = await categoryService.restoreServiceCategory({
        tenantId,
        categoryId,
        actorId,
        actorType,
    });

   return successResponse(
        res,
        200,
        "Service category restored successfully.",
        result,
    );
  }catch(error){
    console.error("🔥 RESTORE SERVICE ERROR:", error);
    next(error);

  }

}
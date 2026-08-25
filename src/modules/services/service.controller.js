import * as Services from "./service.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { successResponse } from "../../utils/apiResponse.js";
import { createServiceSchema, updatePatchSchema } from "./service.validator.js";

export const createServiceController = async (req, res, next) => {
    try {
    // Tenant comes from authenticated user.
    // NEVER accept tenantId from req.body.
    const tenantId = req.user.tenantId;
    const actorId = req.user.id;
    const actorType = req.user.role;

    const payload = createServiceSchema.safeParse(req.body);
    if(!payload.success){
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
    

    const service = await Services.createService({
        tenantId,
        actorId,
        actorType,
        ...payload.data,
        
    });

    return successResponse(
        res,
        201,
        'Service created successfully',
        service,
    )

    }catch(error){
        next(error);

    }
}


//getservice 

export const getServicesController = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const services = await Services.getServices({
      tenantId,
    });

    return successResponse(
      res,
      200,
      "Services retrieved successfully",
      services,
    );
  } catch (error) {
    next(error);
  }
};


export const updateServiceController = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { serviceId } = req.params;

    // const {
    //   name,
    //   description,
    //   basePrice,
    //   currency,
    //   estimatedProcessingDays,
    //   isActive,
    // } = req.body;
    const payload = updatePatchSchema.safeParse(req.body);

    if(!payload.success){
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

    const service = await Services.updateService({
      tenantId,
      serviceId,
      actorId: req.user.id,
      actorType: req.user.role,
  ...payload.data,
});
    return successResponse(
      res,
      200,
      "Service updated successfully",
      service,
    );
  } catch (error) {
    next(error);
  }
};


export const deleteServiceController = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId;
    const actorId = req.user.id;
    const actorType = req.user.role;

    const {serviceId} = req.params;

    const serviceData = await Services.deleteService({
      tenantId,
      serviceId,
      actorId,
      actorType,
    });

    return successResponse(
      res, 
      200,
      "Service deleted successfully!.",
      serviceData,
    );

  }catch(error){
    console.error("🔥 DELETE SERVICE ERROR:", error);
    console.error("🔥 STACK:", error?.stack);
    next(error);
  }
}

export const restoreServiceController = async (req, res, next) => {
  try{
  const {serviceId} = req.params;
  const tenantId = req.user.tenantId;
  const actorId = req.user.id;
  const actorType = req.user.role;
  const serviceData = await Services.restoreService({
    tenantId,
    serviceId,
    actorId,
    actorType,
  });

  return successResponse(
    res, 
    200,
    "Servcie Restored Successfully",
    serviceData
  )
}catch(error){
  console.error("🔥 RESTORE SERVICE ERROR:", error);
  next(error); 
}
}
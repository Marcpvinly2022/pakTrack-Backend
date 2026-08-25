import * as DocumentService from "./document.service.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { successResponse } from "../../utils/apiResponse.js";

import * as DocumentSchema from "./document.validator.js";

// Same fallback shape you inline in service.controller.js, pulled out once.
const formatZodIssues = (error) =>
    error?.issues 
    ? error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
    }))
    :[{field: "body", message: "Invalid payload provided" }];


export const createRequirementController = async (req, res, next ) => {
    try{
        const tenantId = req.user.tenantId;
        const actorId = req.user.id;
        const actorType = req.user.role;

    const params = DocumentSchema.applicationIdParamSchema.safeParse(req.params);
    if(!params){
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "validation field",
            formatZodIssues(params.error)
        );
    }

   const payload = DocumentSchema.createRequirementSchema.safeParse(req.body);
   if(!payload.success){
     throw new AppError(
        400,
        "VALIDATION_ERROR",
        "validation failed",
        formatZodIssues(payload.error)

     )
}

const requirement = await DocumentService.createRequirement({
    tenantId,
    actorId,
    applicationId: params.data.applicationId,
    ...payload.data
});

return successResponse(res, 201, "Document requirement created successfully", requirement);


    }catch(error){
        console.log(" Full ERROR: ", error);
        console.error(" STACK: ", error?.stack);
        next(error)
    }
}



export const listRequirementsController = async (req, res, next) => {
    try{
        const tenantId = req.user.tenantId;
        const actorId = req.user.user;
        const actorType = req.user.role;

        const params = DocumentSchema.listRequirementsQuerySchema.safeParse(req.params)
        if(!params.success){
            throw new AppError(
                404,
                "VALIDATION_ERROR",
                "validation failed.",
                formatZodIssues(params.error)
            )
        }

        const query = DocumentSchema.listRequirementsQuerySchema.safeParse(req.body);
        if(!query.success){
            throw new AppError(
                400, 
                "VALIDATION_ERROR",
                "Validation failed",
                formatZodIssues(query.error)
            )
        }

        const requirements = await DocumentService.listRequirements({
            tenantId,
            actorId,
            actorType,
            applicationId: params.data.applicationId,
            ...query.data
        });
        
    return successResponse(res, 200, "Document requirements retrieved successfully", requirements); 

    }catch(error){
        console.error("🔥 FULL ERROR: ", error);
        console.error(" 🔥 FULL ERROR:", error?.stack);
        next(error)
    }
} 
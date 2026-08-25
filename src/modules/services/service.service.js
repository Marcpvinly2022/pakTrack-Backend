import { prisma } from "../../config/database.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createAuditLog } from "../../services/auditLog.service.js";

export const createService = async ({
  tenantId,
  serviceCategoryId,
  actorId,
  actorType,
  name,
  description,
  basePrice,
  currency,
  estimatedProcessingDays,
}) => {
  // Verify category belongs to this tenant.
  const category = await prisma.serviceCategory.findFirst({
    where: {
      id: serviceCategoryId,
      tenantId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "INVALID_SERVICE_CATEGORY",
      "Service category not found or unavailable",
    );
  }

  //Prevent duplicate service names inside
  // the same tenant + category.

  const existingService = await prisma.service.findFirst({
    where: {
      tenantId,
      serviceCategoryId,
      name,
      deletedAt: null,
    },
  });

  if (existingService) {
    throw new AppError(
      409,
      "SERVICE_EXITS",
      "A service with this name already exists in this category",
    );
  }

  // Create the service
  return prisma.$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        tenantId,
        serviceCategoryId,
        name,
        description,
        basePrice,
        currency,
        estimatedProcessingDays,
      },
    });
    //audit
    await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "CREATE",
      resource: "SERVICE",
      resourceId: service.id,
      status: "SUCCESS",
      metadata: {
        categoryName: category.name,
        serviceName: service.name,
      },
    });

    return service;
  });
};

export const getServices = async ({ tenantId }) => {
  return prisma.service.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      serviceCategory: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateService = async ({
  tenantId,
  serviceId,
  actorId,
  actorType,
  name,
  description,
  basePrice,
  currency,
  estimatedProcessingDays,
  isActive,
}) => {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!service) {
    throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found");
  }

  const updateData = {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(basePrice !== undefined && { basePrice }),
    ...(currency !== undefined && { currency }),
    ...(estimatedProcessingDays !== undefined && {
      estimatedProcessingDays,
    }),
    ...(isActive !== undefined && { isActive }),
  };

  return prisma.$transaction(async (tx) => {
    const updatedService = await tx.service.update({
      where: {
        id: service.id,
      },
      data: updateData,
    });

    await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "UPDATE",
      resource: "SERVICE",
      resourceId: updatedService.id,
      status: "SUCCESS",
      metadata: {
        previous: {
          name: service.name,
          serviceCategoryId: service.serviceCategoryId,
          basePrice: service.basePrice,
          currency: service.currency,
          estimatedProcessingDays: service.estimatedProcessingDays,
          isActive: service.isActive,
        },
        updated: {
          name: updatedService.name,
          serviceCategoryId: updatedService.serviceCategoryId,
          basePrice: updatedService.basePrice,
          currency: updatedService.currency,
          estimatedProcessingDays: updatedService.estimatedProcessingDays,
          isActive: updatedService.isActive,
        },
      },
    });

    return updatedService;
  });
};

export const deleteService = async ({
  tenantId,
  serviceId,
  actorId,
  actorType,
}) => {
  const existingService = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!existingService) {
    throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found");
  }

  return prisma.$transaction(async (tx) => {
    const deletedService = await tx.service.update({
      where: {
        id: existingService.id,
      },

      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "DELETE",
      resource: "SERVICE",
      resourceId: deletedService.id,
      status: "SUCCESS",
      metadata: {
        serviceName: deletedService.name,
        categoryId: deletedService.serviceCategoryId,
      },
    });

    return deletedService;
  });
};

// retore services
export const restoreService = async ({ tenantId, serviceId, actorId, actorType}) => {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId,
      deletedAt: { not: null },
    }, // only a DELETED row
  });

  if (!service) {
    throw new AppError(404, "SERVICE_NOT_FOUND", "Deleted service not found");
  }

  return prisma.$transaction(async (tx) =>{
  const activate = await tx.service.update({
    where: { id: serviceId },
    data: { deletedAt: null, isActive: true },
  });

  await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "ACTIVATE",
      resource: "SERVICE",
      resourceId: activate.id,
      status: "SUCCESS",
      metadata: {
        serviceName: activate.name,
        categoryId: activate.serviceCategoryId,
      },
  });

  return activate;
});

};

import { AppError } from "../../middlewares/errorHandler.js";
import { prisma } from "../../config/database.js";
import { createAuditLog } from "../../services/auditLog.service.js";

export const createServiceCategory = async ({
  tenantId,
  data,
  actorId,
  actorType,
}) => {
  const existingService = await prisma.serviceCategory.findFirst({
    where: {
      tenantId,
      name: { equals: data.name.trim(), mode: "insensitive" },
    },
  });

  if (existingService) {
    throw new AppError(
      400,
      "CATEGORY_ALREADY_EXISTS",
      "Service category already exists.",
    );
  }

  // ✅ FIXED: Only pass fields that explicitly exist in your schema model!
  return prisma.$transaction(async (tx) => {
    const category = await tx.serviceCategory.create({
      data: {
        tenantId,
        name: data.name.trim(),
        description: data.description || null,
      },
    });

    await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "CREATE",
      resource: "SERVICE_CATEGORY",
      resourceId: category.id,
      status: "SUCCESS",
      metadata: {
        categoryName: category.name,
      },
    });

    return category;
  });
};

export const getServiceCategory = async (tenantId) => {
  return await prisma.serviceCategory.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getServiceCategoryById = async ({ tenantId, categoryId }) => {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Service category not found.",
    );
  }

  return category;
};

export const updateServiceCategory = async ({
  tenantId,
  categoryId,
  actorId,
  actorType,
  data,
}) => {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Service category not found.",
    );
  }

  if (data.name && data.name !== category.name) {
    const exists = await prisma.serviceCategory.findFirst({
      where: {
        tenantId,
        name: { equals: data.name.trim(), mode: "insensitive" },
        deletedAt: null,
        NOT: {
          id: categoryId,
        },
      },
    });

    if (exists) {
      throw new AppError(
        409,
        "CATEGORY_ALREADY_EXISTS",
        "A service category with this name already exists.",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.serviceCategory.update({
      where: {
        id: categoryId,
      },
      data: data.name ? { ...data, name: data.name.trim() } : data,
    });

    await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "UPDATE",
      resource: "SERVICE_CATEGORY",
      resourceId: updated.id,
      status: "SUCCESS",
    });

    return updated;
  });
};

export const deleteServiceCategory = async ({
  tenantId,
  categoryId,
  actorType,
  actorId,
}) => {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Service category not found.",
    );
  }
  return prisma.$transaction(async (tx) => {
    const deletedCategory = await tx.serviceCategory.update({
      where: {
        id: categoryId,
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
      resource: "SERVICE_CATEGORY",
      resourceId: deletedCategory.id,
      status: "SUCCESS",
      metadata: {
        categoryName: deletedCategory.name,
      },
    });

    return deletedCategory;
  });
};
export const restoreServiceCategory = async ({ tenantId, categoryId, actorId, actorType }) => {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
      deletedAt: {
        not: null,
      },
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Deleted service category not found.",
    );
  }
 
  return prisma.$transaction(async (tx) =>{
  const activate = await tx.serviceCategory.update({
    where: {
      id: categoryId,
    },
    data: {
      deletedAt: null,
      isActive: true,
    },

  })
  await createAuditLog({
      prisma: tx,
      actorId,
      actorType,
      action: "ACTIVATE",
      resource: "SERVICE_CATEGORY",
      resourceId: activate.id,
      status: "SUCCESS",
      metadata: {
        categoryName: activate.name,
      },
    });
    return activate;
  });
}

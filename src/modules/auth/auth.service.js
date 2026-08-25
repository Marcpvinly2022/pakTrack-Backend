// Used for hashing passwords before storing them.
import { prisma } from "../../config/database.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { ROLES } from "../constants/roles.js";
import { authenticateAccount} from "../../services/authentication.service.js";
import { hashPassword } from "../../utils/password.js";
export const createRegisterAgency = async ({agencyName,subdomain,email,password}) => {

   if (!subdomain) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Cannot perform database unique checks because subdomain is undefined."
    );
  }

  const existingTenant = await prisma.tenant.findUnique({
    where: {
      subdomain,
    },
  });

  if (existingTenant) {
    throw new AppError(
      409,
      "SUBDOMAIN_ALREADY_EXISTS",
      "This subdomain has already been taken."
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "A user with this email already exists."
    );
  }


  const passwordHash = await hashPassword(password);
  
  
  // Transaction
  // Create:
  // 1. Tenant
  // 2. Agency Admin
  // Either both succeed or both rollback.

  const result = await prisma.$transaction(async (tx) => {
    // Create tenant

    const tenant = await tx.tenant.create({
      data: {
        agencyName,
        subdomain,
      },
    });

    // Create first administrator

    const admin = await tx.user.create({
      data: {
        tenantId: tenant.id,

        email,

        passwordHash,

        role: ROLES.AGENCY_ADMIN,
      },
    });

    return {
      tenant,
      admin,
    };
  });

 
  // Return DTO
  // Never return database models directly.
  return {
    tenantId: result.tenant.id,

    userId: result.admin.id,

    agencyName: result.tenant.agencyName,

    subdomain: result.tenant.subdomain,
  };
};

// =============================================
// Login User
// =============================================

export const agencyLogin = async ({ email, password, req }) => {
  
  // Find user including tenant.
  const user = await prisma.user.findFirst({
    where: {
      email,
    },

    include: {
      tenant: true,
    },
  });

  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password."
    );
  }
  
  // Generate Access Token
  const tokens = await authenticateAccount({
      account: user,
      password,
      portal: "ADMIN",
      req
    });

    

  return {
    ...tokens,

    profile: {
      id: user.id,

      email: user.email,

      role: user.role,

      agencyName: user.tenant?.agencyName ?? null,

      subdomain: user.tenant?.subdomain ?? null,
    },
  };
};


export const getCurrentUser = async ({ userId}) => {
  if (!userId) {
    throw new AppError(400, "BAD_REQUEST", "User ID is required.");
  }
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include:{
      tenant: true,
    },
  });

  if(!user){
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "Authenticated user no longer exists."
    );
  }


return {
  id: user.id,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId,
  agencyName: user.tenant?.agencyName,
  subdomain: user.tenant?.subdomain,

}

}
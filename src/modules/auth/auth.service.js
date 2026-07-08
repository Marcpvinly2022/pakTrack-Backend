// Used for hashing passwords before storing them.
import bcrypt from "bcrypt";

// Used for generating JWT access tokens.
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database.js";
import { AppError } from "../../middlewares/errorHandler.js";

const SALT_ROUNDS = 12;

// JWT expiration time.
const TOKEN_EXPIRATION = "12h";

export const registerAgency = async ({agencyName,subdomain,email,password}) => {

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

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // -----------------------------------------
  // Transaction
  //
  // Create:
  // 1. Tenant
  // 2. Agency Admin
  //
  // Either both succeed or both rollback.
  // -----------------------------------------

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

        role: "AGENCY_ADMIN",
      },
    });

    return {
      tenant,
      admin,
    };
  });

  // -----------------------------------------
  // Return DTO
  //
  // Never return database models directly.
  // -----------------------------------------

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

export const loginUser = async ({ email, password }) => {
  
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

  // -----------------------------------------
  // Compare password with stored hash.
  // -----------------------------------------

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password."
    );
  }

// Determine which signing key to use.
  const jwtSecret =
    user.role === "AGENCY_ADMIN" ||
    user.role === "DESK_AGENT"
      ? process.env.JWT_SECRET_STAFF
      : process.env.JWT_SECRET_TRAVELLER;
  // JWT Payload
  // Keep payload small.
  const payload = {
    userId: user.id,

    tenantId: user.tenantId,

    role: user.role,
  };

  // Generate Access Token
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: TOKEN_EXPIRATION,
  });

  // Update last login timestamp.

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      lastLoginAt: new Date(),
    },
  });
  // Return DTO

  return {
    token,

    profile: {
      id: user.id,

      email: user.email,

      role: user.role,

      agencyName: user.tenant?.agencyName ?? null,

      subdomain: user.tenant?.subdomain ?? null,
    },
  };
};
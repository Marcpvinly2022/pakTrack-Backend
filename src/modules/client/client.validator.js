import { z } from "zod";

export const createClientSchema = z.object({
    firstName: z
        .string().trim()
        .min(2, { message: "First name must be at least 2 characters." })
        .max(100)
        .regex(/^[A-Za-z'-\s]+$/, { message: "First name contains invalid characters." }),

    lastName: z
        .string().trim()
        .min(2, { message: "Last name must be at least 2 characters." })
        .max(100)
        .regex(/^[A-Za-z'-\s]+$/, { message: "Last name contains invalid characters." }),

    email: z
        .string().trim()
        .email({ message: "Invalid email address." })
        .max(255)
        .transform((v) => v.toLowerCase()),

    phoneNumber: z
        .string().trim()
        .regex(/^\+?[1-9]\d{9,14}$/, { message: "Phone number must be a valid international number." }),

    // Optional: an admin must name a desk agent; a desk agent omitting it self-assigns.
    assignedDeskAgentId: z
        .string()
        .uuid({ message: "Invalid desk agent id." })
        .optional(),
});



 export const loginClientSchema = z.object({
  email: z
    .email("A valid email address is required.")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password is required."),
});



export const forgotPasswordSchema = z.object({
    email: z
        .email("A valid email address is required.")
        .trim()
        .toLowerCase(),

    accountType: z.enum([
        "CLIENT",
        "USER",
    ]),
});


export const resetPasswordSchema = z.object({

    token: z
        .string()
        .trim()
        .min(1, "Reset token is required."),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .max(100),

    accountType: z.enum([
        "CLIENT",
        "USER",
    ]),
});


export const clientIdParamSchema = z.object({
    clientId: z
        .string()
        .uuid({mssage: "Invalid client id." }),
});

export const createApplicationSchema = z.object({
    serviceId: z
        .string()
        .uuid({message: "invalid service id. "}),
});


export const listClientsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["INVITED", "ACTIVE", "DISABLED"]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const reassignClientSchema = z.object({
    newDeskAgentId: z.string().uuid({ message: "Invalid desk agent id." }),

    // Subset only. INITIAL_ASSIGNMENT is creation-only; DESK_AGENT_DEACTIVATED
    // belongs to the bulk flow in Part B — neither is a valid manual reason.
    reason: z
        .enum(["ADMIN_REASSIGNMENT", "PERFORMANCE_ISSUE", "WORKLOAD_REDISTRIBUTION"])
        .optional()
        .default("ADMIN_REASSIGNMENT"),

    notes: z.string().trim().max(500).optional(),
});


export const checkPasswordSchema = z.object({
    currentPassword: z
    .string()
    .min(8),

    newPassword: z
    .string()
    .min(8),

    confirmPassword: z
    .string()
    .min(8)

})


.refine(
    (data) => data.newPassword === data.confirmPassword,{
    path: ["confirmPassword"],
    message: "Password do not Match.",

    }
)



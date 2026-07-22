import { z } from "zod";

export const registerSchema = z.object({
  agencyName: z
    .string({ required_error: "Agency name is required" })
    .trim()
    .min(3, { message: "Agency name must be at least 3 characters long" })
    .max(255, { message: "Agency name cannot exceed 255 characters" }),

  subdomain: z
    .string({ required_error: "Subdomain is required" })
    .trim()
    .min(3, { message: "Subdomain must be at least 3 characters long" })
    .max(100, { message: "Subdomain cannot exceed 100 characters" })
    .regex(/^[a-zA-Z0-9-_]+$/, { 
      message: "Subdomain can only contain alphanumeric characters, hyphens, and underscores" 
    })
    .transform(v => v.toLowerCase()),

  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email({ message: "Please enter a valid email address" })
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password cannot exceed 100 characters" }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email({ message: "Please enter a valid email address" })
    .transform(v => v.toLowerCase()),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password cannot be blank" }),
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
  .min(8),
})


.refine(
  (data) => data.newPassword === data.confirmPassword,{
    path: ["confirmPassword"],
    message: "Password do not Match.",
  }
);
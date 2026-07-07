import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    agencyName: z.string().trim().min(3, 'Agency name must be at least 3 characters.').max(255),
    subdomain: z.string()
      .trim()
      .min(3, 'Subdomain must be at least 3 characters.')
      .max(100)
      .regex(/^[a-zA-Z0-9-_]+$/, 'Subdomain must contain only alphanumeric characters, hyphens, and underscores.')
      .transform((val) => val.toLowerCase()),
    email: z.string().trim().email('Invalid email address format.').max(255).transform((val) => val.toLowerCase()),
    password: z.string().min(8, 'Password must be at least 8 characters long.').max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address format.').transform((val) => val.toLowerCase()),
    password: z.string().min(1, 'Password cannot be empty.'),
  }),
});
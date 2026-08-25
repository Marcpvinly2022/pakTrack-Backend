import { z } from "zod";

export const createServiceSchema = z.object({
  serviceCategoryId: z.string().uuid(),

  name: z.string().trim().min(2).max(255),

  description: z.string().trim().max(1000).optional(),

  basePrice: z.number().nonnegative().optional(),

  currency: z.string().trim().length(3).default("NGN"),

  estimatedProcessingDays: z.number().int().positive().optional(),
});

export const updatePatchSchema = createServiceSchema.partial();

import { z } from "zod";

// Body — POST /applications/:applicationId/document-requirements
export const createRequirementSchema = z.object({
  title: z.string().trim().min(2).max(255),
  instruction: z.string().trim().max(2000).optional(),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

// Query — GET .../document-requirements  (optional status filter)
export const listRequirementsQuerySchema = z.object({
  status: z
    .enum(["ACTIVE", "INACTIVE", "REPLACED", "NOT_APPLICABLE", "COMPLETED"])
    .optional(),
});

// URL param — validates :applicationId is a real UUID before we hit the DB
export const applicationIdParamSchema = z.object({
  applicationId: z.string().uuid(),
});

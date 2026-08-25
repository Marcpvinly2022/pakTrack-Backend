import {z} from "zod";

export const createServiceCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: "Category name must be at least 2 characters."})
        .max(100,{message: "Category name cannot exceed 100 characters."}),

    description: z
        .string()
        .trim()
        .max(500, {message: "Description cannot exceed 500 characters."})
        .optional()
        .nullable(),
});


export const updateServiceCategorySchema = createServiceCategorySchema.partial();
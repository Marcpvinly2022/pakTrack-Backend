import {z} from "zod";
import { ROLES} from "../constants/roles.js"

//Create Staff
export const createStaffSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address.")
        .max(255)
        .transform((v) => v.toLowerCase()),
    
    password: z
        .string()
        .min(8, {message: "password must be at least 8 characters."})
        .max(100),

    role: z
        .enum([ROLES.DESK_AGENT],{
            errorMap: () => ({
                message: "Role must be DESK_AGENT.",
            }),
        }),
});

//update staff status 
export const updateStaffSchema = z.object({
    isActive: z
       .boolean(),
});

//staff Id parameter 
export const staffIdParamSchema = z.object({
    id: z
        .string()
        .uuid({message: "Invalid staff id."}),
});
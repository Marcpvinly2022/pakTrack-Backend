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
    .min(8, {
        message: "Password must be at least 8 characters.",
    })
    .max(100)
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]+$/,
        {
            message:
                "Password must contain an uppercase letter, lowercase letter, number and special character.",
        }
    ),

    firstName: z
        .string()
        .trim()
        .min(2,{message: "First name must be at least 2 characters."})
        .max(100)
        .regex(
        /^[A-Za-z'-\s]+$/,
        {
            message: "First name contains invalid characters.",
        }
    ),

    lastName: z
        .string()
        .trim()
        .min(2,{message: "Last name must be at least 2 characters."})
        .max(100)
        .regex(
        /^[A-Za-z'-\s]+$/,
        {
            message: "First name contains invalid characters.",
        }
    ),
        

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
       . boolean({ message: "isActive flag status is required." })
});

//staff Id parameter 
export const staffIdParamSchema = z.object({
    id: z
        .string()
        .uuid({message: "Invalid staff id."}),
});
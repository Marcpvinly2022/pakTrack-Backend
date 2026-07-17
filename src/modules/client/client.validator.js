import {z} from "zod";

export const createClientSchema = z.object({
    
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
        

    email: z
        .string()
        .trim()
        .email({
            message: "Invalid email address.",
        })
        .max(255)
        .transform((value) => value.toLowerCase()),


    phoneNumber: z
    .string()
    .trim()
    .regex(
        /^\+?[1-9]\d{9,14}$/,
        {
            message:
                "Phone number must be a valid international number.",
        }
    ),

    serviceCategoryId: z
        .string()
        .uuid({message:"Invalid Service category id."}),
});
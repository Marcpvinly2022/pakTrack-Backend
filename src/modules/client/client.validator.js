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
            message: "last name contains invalid characters.",
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


export const loginClientSchema = z.object({
  email: z
    .email("A valid email address is required.")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password is required."),
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
import {z} from "zod";

export const validateInvitationSchema = z.object({
    token: z
        .string().ulid({message: "Invalid invitation token."})
})


export const createPasswordSchema = z.object({
    token: z
        .string().uuid(),
        
    password: z
        .string()
        .min(10,{message:"Password must be at least 8 characters."})
        .max(100),

});
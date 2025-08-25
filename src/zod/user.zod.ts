import { z } from "zod";
import { Types } from "mongoose";

export const zodUserSchema = z.object({
    name: z
    .string()
    .min(1,"name cant be empty")
    .max(255,"name is too long"),

    email: z
    .string()
    .email("invalid email id"),

    password: z
    .string()
    .min(6,"password should be atleast 6 characters long"),

    profilePhotoUrl: z
    .string()
    .url("invalid profile photo url")
    .optional(),

    role: z
    .enum(["admin","student"])
    .default("student")
})

export type userT = z.infer<typeof zodUserSchema>;
export type userType = userT & {_id: Types.ObjectId, getJwt():string};
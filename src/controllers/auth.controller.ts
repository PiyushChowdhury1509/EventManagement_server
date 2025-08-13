import { User } from "../models/user";
import { Request,Response } from "express";
import { zodUserSchema } from "../zod/user.zod";
import { z } from "zod"
import { comparePassword, hashPassword } from "../utils/password";
import { userType } from "../zod/user.zod";

export const createUser = async( req: Request, res: Response) => {
    try{
        const data = req.body;
        const refinedData = zodUserSchema.parse(data);

        const existingUser: userType | null = await User.findOne({
             email: refinedData.email 
        })
        if(existingUser){
            res.status(409).json({
                success: false,
                message: "user already exists with this data"
            })
            return;
        }

        const { password } = refinedData;
        const hashedPassword: string = await hashPassword(password);
        refinedData.password = hashedPassword;

        const newUser = new User(refinedData);
        await newUser.save();

        const token:string = newUser.getJwt();
        res.cookie("token",token);

        res.status(201).json({
            success: true,
            message: "user successfully created",
        })
        return;

    } catch(error){
        console.log(error)
        if(error instanceof z.ZodError){
            res.status(400).json({
                success: false,
                message: "invalid data",
            })
        }
        res.status(500).json({
            success: false,
            message: "something went wrong",
        })
        return;
    }
}



export const loginUser = async( req: Request, res: Response) => {
    try{

        const zodLoginSchema = z.object({
            email: z
            .string()
            .email("invalid email"),

            password: z
            .string()
            .min(6,"password must be atleast 6 characters long")
        });

        const data = req.body;
        
        const refinedData = zodLoginSchema.parse(data);

        const user: userType | null = await User.findOne({
            email: refinedData.email
        })
        if(!user){
            res.status(400).json({
                success: false,
                message: "user not found"
            })
            return;
        }

        const isPasswordCorrect: boolean = await comparePassword(refinedData.password, user.password);
        if(!isPasswordCorrect){
            res.status(401).json({
                success: false,
                message: "wrong credentials"
            })
            return;
        }

        const token:string = user.getJwt();
        res.cookie("token",token);

        res.status(200).json({
            success: true,
            message: "sign in successfull"
        })
        return;

    } catch(error){
        
        if(error instanceof z.ZodError){
            res.status(400).json({
                success: false,
                message: "invalid data"
            })
            return;
        }

        res.status(500).json({
            success: false,
            message: "internal server error"
        })
        return;
    }
}
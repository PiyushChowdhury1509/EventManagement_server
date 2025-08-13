import jwt from 'jsonwebtoken'
import { Request,Response,NextFunction } from 'express'
import { userType } from '../zod/user.zod'
import { User } from '../models/user';
import { success } from 'zod/v4/index.cjs';

const jwtChecker = async (token: string): Promise<userType | null> => {

    const decoded = jwt.verify(token,process.env.JWT_SECRET!) as { _id: string};
    const { _id } = decoded;

    if(!_id) return null;
    const user: userType | null = await User.findById(_id);
    if(!user) return null;

    return user;
}

export const studentAuth = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { token } = req.cookies;
        if(!token){
            res.status(400).json({
                success: false,
                message: "signin again"
            })
            return;
        }

        const user: userType | null = await jwtChecker(token);
        if(!user){
            res.status(400).json({
                success: false,
                message: "invalid token"
            })
            return;
        }

        if(user.role!=='student'){
            res.status(403).json({
                success: false,
                message: "access forbidden"
            })
            return;
        }

        (req as any).user=user;
        next();
    } catch(err){
        res.status(500).json({
            success: false,
            message: "internal server error"
        })
        return;
    }
}


export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { token } = req.cookies;
        if(!token){
            res.status(400).json({
                success: false,
                message: "signin again"
            })
            return;
        }

        const user: userType | null = await jwtChecker(token);
        if(!user){
            res.status(400).json({
                success: false,
                message: "invalid token"
            })
            return;
        }

        if(user.role!=='admin'){
            res.status(403).json({
                success: false,
                message: "access forbidden"
            })
            return;
        }

        (req as any).user=user;
        next();
    } catch(err){
        res.status(500).json({
            success: false,
            message: "internal server error"
        })
        return;
    }
}
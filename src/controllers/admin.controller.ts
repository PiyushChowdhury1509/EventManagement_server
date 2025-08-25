import { Request,Response } from "express";
import { zodNoticeSchema } from "../zod/notice.zod";
import z from "zod";
import { Notice } from "../models/notice";
import { Category } from "../models/category";

const createCategory = async (category: string):Promise<string | undefined> => {
    try{
        const newCategoryName = category.toLowerCase();

        const existingCategory = await Category.findOne({ name : newCategoryName });
        if(!existingCategory){
            const createdCategory = new Category({ name: newCategoryName});
            await createdCategory.save();
            return createdCategory._id.toJSON()
        }
        return existingCategory._id.toJSON();

    } catch(error){
        console.log("category couldnt be created", error);
    }
}

export const createNotice = async (req: Request, res: Response) => {
    try{
        const { user } = req as any;
        if(!user){
            res.status(401).json({
                success: false,
                message: "please signin again"
            });
            return;
        }

        const data = req.body;
        const refinedData = zodNoticeSchema.parse(data);
        if(!refinedData.category) return;

        const categoryId = await createCategory(refinedData.category);

        const noticeData = {...refinedData, createdBy: user };
        noticeData.category=categoryId

        const newNotice = new Notice(noticeData);
        await newNotice.save();

        res.status(201).json({
            success: true,
            message: "notice successfully created"
        });
        return;


    } catch(error){
        console.log(error)
        if(error instanceof z.ZodError){
            res.status(400).json({
                success: false,
                message: "invalid data",
                error: error
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: error
        })
        return;
    }
}
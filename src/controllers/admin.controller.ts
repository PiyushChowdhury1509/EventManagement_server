import { NextFunction, Request,Response } from "express";
import { zodNoticeSchema } from "../zod/notice.zod";
import z from "zod";
import { Notice } from "../models/notice";
import { Category } from "../models/category";
import { uploadOnCloudinary } from "../utils/cloudinary";
import fs from "fs"
import { File, IFile } from "../models/file";
import { Event } from "../models/event";

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

        const noticeData = {...refinedData, createdBy: user._id };
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


export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { name, description, date, category } = req.body as { name: string, description: string, date: string, category: string};
        console.log("controller reached",req.body);

        const { user } = (req as any);

        if(!name || !description || !date) {
            return res.status(400).json({
                success: false,
                message: "missing fields are required"
            });
        }
        
        const parsedDate = new Date(date);
        if(isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "invalid date format"
            });
        }
        if(parsedDate<=new Date()) {
            return res.status(400).json({
                success: false,
                message: "event date must be in future"
            });
        }

        const files = req.files;
        const fileDocs = [];
        console.log("files are: ",files);

        if(files && Array.isArray(files)) {
            console.log("if statement reached")
            for(const file of files){
                try {
                    const url = await uploadOnCloudinary(file.path);
                    console.log("url: ",url)
                     
                    fs.unlinkSync(file.path);

                    const savedFile: IFile = await File.create({
                        url,
                        type: file.mimetype,
                        name: file.originalname,
                        size: file.size,
                    });
                    console.log("saved file: ",savedFile)
                    fileDocs.push(savedFile._id);
                } catch (fileError) {
                    console.error("Error processing file:", fileError);
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }
        const updatedCategory = await createCategory(category);
        console.log("updated category",updatedCategory);
        const createdEvent = await Event.create({
            name,
            description,
            date,
            category: updatedCategory || "others",
            createdBy: user._id,
            files: fileDocs
        });
        console.log("RES",createdEvent)
        res.status(201).json({
            success: true,
            message: "event created successfully",
            data: createdEvent
        });
        return;

    } catch(error){
        console.log("ERROR",error);
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: error
        });
        return;
    }
}

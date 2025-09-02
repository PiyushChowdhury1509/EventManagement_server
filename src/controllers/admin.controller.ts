import { NextFunction, Request,Response } from "express";
import { zodNoticeSchema } from "../zod/notice.zod";
import z from "zod";
import { Notice } from "../models/notice";
import { Category } from "../models/category";
import { uploadOnCloudinary } from "../utils/cloudinary";
import fs from "fs"
import { File, IFile } from "../models/file";
import { Event } from "../models/event";
import { userType } from "../zod/user.zod";
import { Form } from "../models/form";
import { createEventSchema } from "../zod/createEvent.zod";

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



export const cloneForm = async (req: Request, res: Response) => {
    try{

        const { user } = (req as any) as { user: userType };
        const { formId } = req.body;
        const { page, limit, mine } = req.query;


        if(!page || !limit || (limit<'1' || page<'1') || !formId || (mine!='false' && mine!='true')){
            res.status(400).json({
                success: false,
                message: "invalid request"
            });
            return;
        }

        const skip: number = (Number(page)-1)*(Number(limit));

        if(mine == 'true') {
            const formData = await Form.find({_id: user._id}).skip(skip).limit(Number(limit)).lean();
            res.status(200).json({
                success: true,
                message: "forms fetched successfully",
                data: formData
            });
            return;
        } else{
            const myData = await Form.find({_id: user._id}).skip(skip).limit(Number(limit));
            const formIds = myData.map((forms)=>forms._id.toString());
            
            const formData = await Form.find({
                _id: { $nin: formIds}
            }).skip(skip).limit(Number(limit)).lean();

            res.status(200).json({
                success: true,
                message: "forms fetched successfully",
                data: formData
            });
            return;
        }

    } catch(error){
        console.log("internal server error: ",error);
        res.status(500).json({
            success: false,
            message: "internal server error"
        });
        return;
    }
}

export const createEvent = async (req: Request, res: Response) => {
    try{
        const { user } = (req as any) as { user: userType };

        const { date } = req.body;
        const newDate = new Date(date);
        req.body.date = newDate;

        const parsedData = createEventSchema.parse(req.body);

        let formDoc = null;
        if (parsedData.form) {
            formDoc = await Form.create({
                name: parsedData.form.name,
                fields: parsedData.form.fields,
                createdBy: user._id,
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
                     
                    fs.promises.unlink(file.path);

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
                    console.log(file.path);
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }

        const category = parsedData.category || "others"
        const updatedCategory = await createCategory(category);
        console.log("updated category",updatedCategory);

        const createdEvent = await Event.create({
            name: parsedData.name,
            description: parsedData.description,
            date: parsedData.date,
            category,
            createdBy: user._id,
            files: fileDocs,
            form: formDoc?._id
        });
        console.log("created event: ",createdEvent)
        res.status(201).json({
            success: true,
            message: "event created successfully",
            data: createdEvent
        });
        return;

    } catch(error){
        console.log(error);
        if(error instanceof z.ZodError){
            res.status(400).json({
                success: false,
                message: "the data is invalid",
                error: error
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "internal server error",
            error: error
        });
        return;
    }
}

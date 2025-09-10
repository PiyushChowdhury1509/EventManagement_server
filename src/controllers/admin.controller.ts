import { NextFunction, Request, Response } from "express";
import { zodNoticeSchema } from "../zod/notice.zod";
import z from "zod";
import { Notice } from "../models/notice";
import { Category } from "../models/category";
import { uploadOnCloudinary } from "../utils/cloudinary";
import fs from "fs";
import { File, IFile } from "../models/file";
import { Event, IEvent } from "../models/event";
import { userType } from "../zod/user.zod";
import { Form, IForm } from "../models/form";
import { createEventSchema } from "../zod/createEvent.zod";
import { Types } from "mongoose";

const createCategory = async (
  category: string
): Promise<string | undefined> => {
  try {
    const newCategoryName = category.toLowerCase();

    const existingCategory = await Category.findOne({ name: newCategoryName });
    if (!existingCategory) {
      const createdCategory = new Category({ name: newCategoryName });
      await createdCategory.save();
      return createdCategory._id.toJSON();
    }
    return existingCategory._id.toJSON();
  } catch (error) {
    console.log("category couldnt be created", error);
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "please signin again",
      });
      return;
    }

    const data = req.body;
    const refinedData = zodNoticeSchema.parse(data);
    if (!refinedData.category) return;

    //const categoryId = await createCategory(refinedData.category);

    const noticeData = { ...refinedData, createdBy: user._id };
    //noticeData.category=categoryId

    const newNotice = new Notice(noticeData);
    await newNotice.save();

    res.status(201).json({
      success: true,
      message: "notice successfully created",
    });
    return;
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "invalid data",
        error: error,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const cloneForm = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    const { formId } = req.body;
    const { page, limit, mine } = req.query;

    if (
      !page ||
      !limit ||
      limit < "1" ||
      page < "1" ||
      !formId ||
      (mine != "false" && mine != "true")
    ) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    const skip: number = (Number(page) - 1) * Number(limit);

    if (mine == "true") {
      const formData = await Form.find({ _id: user._id })
        .skip(skip)
        .limit(Number(limit))
        .lean();
      res.status(200).json({
        success: true,
        message: "forms fetched successfully",
        data: formData,
      });
      return;
    } else {
      const myData = await Form.find({ createdBy: user._id })
        .skip(skip)
        .limit(Number(limit));
      const formIds = myData.map((forms) => forms._id.toString());

      const formData = await Form.find({
        _id: { $nin: formIds },
      })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      res.status(200).json({
        success: true,
        message: "forms fetched successfully",
        data: formData,
      });
      return;
    }
  } catch (error) {
    console.log("internal server error: ", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
    return;
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    console.log("user: ", user);
    const { event = {}, form = null } = req.body;

    let eventDate: Date | null = null;
    if (event.eventDate) {
      eventDate = new Date(event.eventDate);

      if (event.eventTime) {
        const [hours, minutes] = event.eventTime.split(":").map(Number);
        eventDate.setHours(hours || 0, minutes || 0, 0, 0);
      }
    }

    let endDate: Date | null = null;
    if (event.endDate) {
      endDate = new Date(event.endDate);

      if (event.endTime) {
        const [hours, minutes] = event.endTime.split(":").map(Number);
        endDate.setHours(hours || 0, minutes || 0, 0, 0);
      }
    }

    let formDoc = null;
    if (form && form.name) {
      formDoc = await Form.create({
        name: form.name,
        fields: form.fields || [],
        createdBy: user._id,
      });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const fileDocs: string[] = [];

    if (files?.length) {
      for (const file of files) {
        try {
          const url = await uploadOnCloudinary(file.path);
          await fs.promises.unlink(file.path);

          const savedFile: IFile = await File.create({
            url,
            type: file.mimetype,
            name: file.originalname,
            size: file.size,
          });

          fileDocs.push(savedFile._id.toString());
        } catch (fileError) {
          console.error("Error processing file:", fileError);
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    const category = event.category || "others";
    const updatedCategory = await createCategory(category);

    const createdEvent: IEvent = await Event.create({
      name: event.name,
      description: event.details || "",
      location: event.location || "",
      date: eventDate,
      endDate: endDate,
      category: "others",
      createdBy: user._id,
      files: fileDocs,
      form: formDoc?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "event created successfully",
      data: createdEvent,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "the data is invalid",
        error: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "internal server error",
      error,
    });
  }
};

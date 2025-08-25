import { Request, Response } from "express";
import z from "zod";
import { noticeType } from "../zod/notice.zod";
import { Notice } from "../models/notice";

export const getNotices = async (req: Request, res: Response) => {
  try {
    const  status  = req.params.status;
    if (!status) {
      res.status(400).json({
        success: false,
        message: "notice status isnt present",
      });
      return;
    }
    let noticeData: Array<noticeType> = [];

    switch (status) {
      case "expired":
        noticeData = await Notice.find({
          terminationDate: { $lt: Date.now() },
        });
        break;

      case "upcoming":
        noticeData= await Notice.find({
          terminationDate: { $gte: Date.now() },
        }).sort({ terminationDate: 1 });
        break;

       case "urgent":
        noticeData = await Notice.find({
            terminationDate: { $gte: Date.now(), $lt: Date.now()+24*60*60},
        }).sort({ terminationDate: 1});
        break;

        default: 
         res.status(400).json({
            success: false,
            message: "invalid request"
         });
         return;
    }

    if(noticeData.length===0){
        res.status(200).json({
            success: true,
            message: "no notices found"
        })
        return;
    }

    res.status(200).json({
        success: true,
        message: "notices fetched successfully",
        data: noticeData
    })
    return;

  } catch (error) {
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

import { Request, Response } from "express";
import z from "zod";
import { noticeType } from "../zod/notice.zod";
import { Notice } from "../models/notice";
import { isValidObjectId, trusted } from "mongoose";
import { userType } from "../zod/user.zod";
import { Event } from "../models/event";
import { Comment } from "../models/comment";
import { Like } from "../models/like";

export const getNotices = async (req: Request, res: Response) => {
  try {
    const status = req.params.status;
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
        noticeData = await Notice.find({
          terminationDate: { $gte: Date.now() },
        }).sort({ terminationDate: 1 });
        break;

      case "urgent":
        noticeData = await Notice.find({
          terminationDate: { $gte: Date.now(), $lt: Date.now() + 24 * 60 * 60 },
        }).sort({ terminationDate: 1 });
        break;

      default:
        res.status(400).json({
          success: false,
          message: "invalid request",
        });
        return;
    }

    if (noticeData.length === 0) {
      res.status(200).json({
        success: true,
        message: "no notices found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "notices fetched successfully",
      data: noticeData,
    });
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

export const handleLike = async (req: Request, res: Response) => {
  try {
    const { like, targetType, targetId } = req.params;
    if (!targetType || !targetId) {
      res.status(400).json({
        success: false,
        message: "some required fields arent present",
      });
      return;
    }

    if (!isValidObjectId(targetId)) {
      res.status(400).json({
        success: false,
        message: "invalid content id",
      });
      return;
    }
    const allowedTargetTypeValues = ["notice", "event", "comment"];
    if (!allowedTargetTypeValues.includes(targetType)) {
      res.status(400).json({
        success: false,
        message: "invalid target type",
      });
      return;
    }

    const { user } = req as any as { user: userType };
    let trueTarget;

    switch (targetType) {
      case "notice":
        const notice = await Notice.findById(targetId);
        trueTarget = notice;
        break;

      case "event":
        const event = await Event.findById(targetId);
        trueTarget = event;
        break;

      case "comment":
        const comment = await Comment.findById(targetId);
        trueTarget = comment;
        break;
    }

    if (!trueTarget) {
      res.status(400).json({
        success: false,
        message: "target content not found",
      });
      return;
    }

    if (like==='1') {
      const existingLike = await Like.findOne({
        userId: user._id,
        targetType,
        target: trueTarget
      })
      if(existingLike){
        res.status(409).json({
          success: false,
          message: "content already liked"
        });
        return;
      }

      const newLike = new Like({
        userId: user._id,
        targetType,
        target: trueTarget,
      });

      await newLike.save();
      trueTarget.likeCount++;
      await trueTarget.save();

      res.status(201).json({
        success: true,
        message: "liked successfully",
      });
      return;
    } else{
      const deletedLike = await Like.findOneAndDelete({
        userId: user._id,
        targetType,
        target: trueTarget
      });

      if(!deletedLike){
        res.status(409).json({
          success: false,
          message: "like doesnt exist"
        });
        return;
      }
      trueTarget.likeCount--;
      await trueTarget.save();
      res.status(200).json({
        success: true,
        message: "content unliked successfully"
      });
      return;
    }

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

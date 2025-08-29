import { Request, Response } from "express";
import z from "zod";
import { noticeType } from "../zod/notice.zod";
import { Notice } from "../models/notice";
import { isValidObjectId } from "mongoose";
import { userType } from "../zod/user.zod";
import { Event } from "../models/event";
import { Comment } from "../models/comment";
import { Like } from "../models/like";
import { Registration } from "../models/registration";

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

    if(like!=='1' && like!=='0'){
      res.status(400).json({
        success: false,
        message: "invalid request"
      })
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
    } else {
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
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};


export const addComment = async (req: Request, res: Response) => {
  try{

    const { targetType, targetId } = req.params;
    const { commentContent } = req.body;
    const { user } = (req as any) as { user: userType };

    let urlError:boolean=false;
    if(!isValidObjectId(targetId)) urlError=true;
    else if(!(["notice","event","comment"].includes(targetType))) urlError=true;


    if(urlError){
      res.status(400).json({
        success: false,
        message: "invalid request"
      })
      return;
    }

    if(targetType === 'comment'){
      const targetComment = await Comment.findById(targetId);

      if(!targetComment){
        throw new Error("comment not found");
      }

      if(targetComment.depth === 2){
        res.status(422).json({
          success: false,
          message: "max comment depth reached"
        });
        return;
      }

      const newComment = new Comment({
        content: commentContent,
        createdBy: user._id,
        parentId: targetComment._id,
        targetType: targetComment.targetType,
        target: targetComment.target,
        depth: targetComment.depth +1
      });

      await newComment.save();

      res.status(201).json({
        success: true,
        message: "replied successfully"
      });
      return;
    }

    const Post = targetType === 'event' ? Event : Notice;

    const [ createdComment, updatedPost ] = await Promise.all([
      Comment.create({
        content: commentContent,
        createdBy: user._id,
        targetType,
        target: targetId
      }),

      Post.updateMany(
        {_id: targetId},
        { $inc: { commentCount: 1}}
      )
    ]);

    res.status(201).json({
      success: true,
      message: "comment added successfully",
      data: [createdComment,updatedPost]
    });
    return;

  } catch(error){
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error
    })
    return;
  }
}

export const deleteComment = async (req: Request, res: Response) => {
  try{

    const { targetId } = req.params;

    if(!targetId || !isValidObjectId(targetId)){
      res.status(400).json({
        success: false,
        message: "invalid request"
      });
      return;
    }

    const deletedComment = await Comment.findByIdAndDelete(targetId);

    if(!deletedComment){
      res.status(404).json({
        success: false,
        message: "comment not found"
      });
      return;
    }

    let updatedPost: any=null;
    if(deletedComment.targetType==='event'){
      updatedPost = await Event.findByIdAndUpdate({_id: deletedComment.target},{$inc: {commentCount: -1}})
    } else{
      updatedPost = await Notice.findByIdAndUpdate({_id: deletedComment.target},{$inc: {commentCount: -1}})
    }

    if(!updatedPost){
      throw new Error("post wasnt found");
    }

    res.status(200).json({
      success: true,
      message: "comment deleted successfully",
      data: [deletedComment]
    });
    return;

  } catch(error){
    res.status(500).json({
      success: false,
      message: "internal server error"
    });
    return;
  }
}



export const getEvents = async (req: Request, res: Response) => {
  try{
     
    const { user } = (req as any) as { user: userType};
    const { type = "all", status = "all" } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    if(!page || !limit){
      res.status(400).json({
        success: false,
        message: "invalid request"
      });
      return;
    }

    const registrations = await Registration.find({
      student: user._id
    }).skip((page-1)*(limit)).limit(limit).lean();

    const registeredEventIds = registrations.map(r => r.event.toString());

    let filter = {};

    if(type === "registered"){
      //@ts-ignore
      filter._id = { $in: registeredEventIds };
    } else if(type === "unregistered"){
      //@ts-ignore
      filter._id = { $nin: registeredEventIds };
    }

    const now = new Date();
    if(status === "past"){
      //@ts-ignore
      filter.eventDate = { $lt: now };
    } else if(status === "upcoming"){
      //@ts-ignore
      filter.eventDate = { $gte: now };
    }

    let events:any = await Event.find(filter).lean();

    if(type === "all"){
      events = events.map((e:any) => ({
        ...e,
        registered: registeredEventIds.includes(e._id.toString())
      }))
    }

    res.status(200).json({
      success: true,
      message: "events fetched successfully",
      data: events
    });
    return;

  } catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error"
    });
    return;
  }
}
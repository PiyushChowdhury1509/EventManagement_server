import { Request, Response } from "express";
import z, { date } from "zod";
import { INotice, Notice } from "../models/notice";
import { isValidObjectId } from "mongoose";
import { userType } from "../zod/user.zod";
import { Event, IEvent } from "../models/event";
import { Comment } from "../models/comment";
import { Like } from "../models/like";
import { IRegistration, Registration } from "../models/registration";
import { Form, IForm } from "../models/form";
import { IUser, User } from "../models/user";
import { EventRegistrationStatus, EventStatus } from "../Types/event.types";
import {
  LikeType,
  NoticeStatusType,
  PostType,
  ResourceType,
} from "../Types/resource.types";
import { uploadOnCloudinary } from "../utils/cloudinary";
import fs from "fs";

export const getNotices = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    let {
      page,
      limit,
      status = NoticeStatusType.UPCOMING,
      categories,
      startDate,
      endDate,
    } = req.query;

    if (status === "active") status = NoticeStatusType.UPCOMING;
    else if (status === "archived") status = NoticeStatusType.EXPIRED;
    else if (status === "all") status = NoticeStatusType.URGENT;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 5;

    const filter: any = {};
    console.log("status: ", status);

    switch (status) {
      case NoticeStatusType.EXPIRED:
        filter.date = { $lt: new Date() };
        break;

      case NoticeStatusType.UPCOMING:
        filter.date = { $gte: new Date() };
        break;

      case NoticeStatusType.URGENT:
        filter.date = {
          $gte: new Date(),
          $lt: new Date(Date.now() + 24 * 60 * 60),
        };
        break;

      default:
        console.log("default hitting");
        return res.status(400).json({
          success: false,
          message: "invalid request",
        });
    }
    console.log("after");
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate as string);
      }
    }

    if (categories) {
      const categoryList = (categories as string)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const categoryArray = categoryList.map((c) => c.toLowerCase());

      if (categoryList.length > 0) {
        filter.category = { $in: categoryArray };
      }
    }
    const notices = await Notice.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ date: 1 });

    const noticeIds = notices.map((n) => n._id);

    const likes = await Like.find({
      userId: user?._id || "68ac321f563690fefd120c7f",
      targetType: "notice",
      target: { $in: noticeIds },
    }).lean();

    const likedIds = new Set(likes.map((l) => l.target.toString()));

    const noticeData = notices.map((n) => ({
      ...n.toObject(),
      isLiked: likedIds.has(n._id.toString()),
    }));

    const totalCount = await Notice.countDocuments(filter);

    if (noticeData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "no notices found",
        data: [],
        meta: { totalCount: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "notices fetched successfully",
      data: noticeData,
      meta: { totalCount },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      error,
    });
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

    if (like !== LikeType.LIKE && like !== LikeType.UNLIKE) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    const { user } = req as any as { user: userType };
    let trueTarget;

    switch (targetType) {
      case ResourceType.NOTICE:
        const notice = await Notice.findById(targetId);
        trueTarget = notice;
        break;

      case ResourceType.EVENT:
        const event = await Event.findById(targetId);
        trueTarget = event;
        break;

      case ResourceType.COMMENT:
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

    if (like === LikeType.LIKE) {
      const existingLike = await Like.findOne({
        userId: user._id,
        targetType,
        target: trueTarget,
      });
      if (existingLike) {
        res.status(409).json({
          success: false,
          message: "content already liked",
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
        target: trueTarget,
      });

      if (!deletedLike) {
        res.status(409).json({
          success: false,
          message: "like doesnt exist",
        });
        return;
      }
      trueTarget.likeCount--;
      await trueTarget.save();
      res.status(200).json({
        success: true,
        message: "content unliked successfully",
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

export const fetchEvents = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    const {
      type = EventRegistrationStatus.NOTREGISTERED,
      status = EventStatus.UPCOMING,
      pageNum = "1",
      limitNum = "10",
    } = req.query;

    const page = Number(pageNum);
    const limit = Number(limitNum);

    if (!type || !status || !page || !limit || limit < 1 || page < 1) {
      res.status(400).json({
        success: true,
        message: "invalid query params",
      });
      return;
    }

    const registrations = await Registration.find({
      student: user._id,
    }).lean();

    const registrationIds = registrations.map((r) => r.event.toString());

    const filter: any = {};
    if (type === EventRegistrationStatus.REGISTERED) {
      filter._id = { $in: registrationIds };
    } else if (type === EventRegistrationStatus.NOTREGISTERED) {
      filter._id = { $nin: registrationIds };
    }

    if (status === EventStatus.UPCOMING) {
      filter.date = { $gte: new Date() };
    } else if (status === EventStatus.FINISHED) {
      filter.date = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const events = await Event.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .populate("category", "name")
      .populate("createdBy", "name")
      .populate("files", "name size url")
      .lean();

    res.status(200).json({
      success: true,
      message: "events fetched successfully",
      data: events,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const registerEvent = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const { eventId, responses } = req.body;

    if (!eventId) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    const event: IEvent | null = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "event not found",
      });
      return;
    }

    const alreadyRegistered: IRegistration | null = await Registration.findOne({
      student: user._id,
      event: event._id,
    });

    if (alreadyRegistered) {
      res.status(400).json({
        success: false,
        message: "you have already registered for this event",
        data: alreadyRegistered,
      });
      return;
    }

    let formId: any = null;
    if (event.form) {
      const form: IForm | null = await Form.findById(event.form);
      if (!form) {
        res.status(404).json({
          success: false,
          message: "form not found",
        });
        return;
      }

      formId = form._id;

      for (const field of form.fields) {
        const answered = responses?.find(
          (r: any) => r.fieldLabel === field.label
        );
        if (field.required && !answered) {
          return res.status(400).json({
            success: false,
            message: `Missing response for required field: ${field.label}`,
          });
        }
      }
    }

    event.participants?.push(user._id);
    const [registration, updatedEvent]: [IRegistration, IEvent] =
      await Promise.all([
        Registration.create({
          student: user._id,
          event: event._id,
          form: formId || null,
          responses: responses || [],
        }),

        event.save(),
      ]);

    res.status(201).json({
      success: true,
      message: "registration successfull",
      data: { registration, updatedEvent },
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const user: IUser | null = await User.findById(profileId).lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "user fetched successfully",
      data: user,
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
    return;
  }
};

export const fetchAdminResources = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { pageNum, limitNum, status, resource } = req.query;

    const page = Number(pageNum);
    const limit = Number(limitNum);

    if (
      !pageNum ||
      !limitNum ||
      isNaN(page) ||
      isNaN(limit) ||
      page < 1 ||
      limit < 1 ||
      (resource != ResourceType.NOTICE && resource != ResourceType.EVENT) ||
      (status != EventStatus.FINISHED && status != EventStatus.UPCOMING)
    ) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    const admin: IUser | null = await User.findById(adminId);

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "admin not found",
      });
      return;
    }

    let Resource: any = null;
    if (resource === ResourceType.EVENT) Resource = Event;
    else Resource = Notice;

    let data: any = null;
    if (status === EventStatus.FINISHED) {
      data = await Resource.find({
        createdBy: admin._id,
        date: { $lt: new Date() },
      })
        .sort({ date: -1 })
        .lean();
    } else {
      data = await Resource.find({
        createdBy: admin._id,
        date: { $gte: new Date() },
      })
        .sort({ date: 1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      message: "data fetched successfully",
      data: data,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const getParticularResource = async (req: Request, res: Response) => {
  try {
    const { resource } = req.query;
    const { resourceId } = req.params;

    if (resource !== ResourceType.NOTICE && resource !== ResourceType.EVENT) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    let Resource: any = null;
    if (resource === ResourceType.EVENT) Resource = Event;
    else Resource = Notice;

    let query = Resource.findById(resourceId)
      .populate("category", "name")
      .populate("createdBy", "name");

    if (resource === ResourceType.EVENT) {
      query.populate("files", "url type name size");
    }

    const data: IEvent | INotice | null = await query;

    if (!data) {
      res.status(404).json({
        success: false,
        message: `${resource} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `${resource} fetched successfully`,
      data: data,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const editProfile = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    const { name } = req.body;

    const updates: Partial<IUser> = {};
    if (name) updates.name = name;

    if (req.file) {
      try {
        const imageUrl = await uploadOnCloudinary(req.file.path);
        updates.profilePhotoUrl = imageUrl;
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({
          success: false,
          message: "Photo upload failed",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "user updated successfully",
      data: updatedUser,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    const { postType, postId } = req.params as {
      postType: PostType;
      postId: string;
    };
    const { targetType, targetId, commentContent } = req.body as {
      targetType: ResourceType;
      targetId: string;
      commentContent: string;
    };

    if (!postType || !postId || !targetId || !targetType || !commentContent) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    if (
      (postType === PostType.EVENT && targetType === ResourceType.NOTICE) ||
      (postType === PostType.NOTICE && targetType === ResourceType.EVENT)
    ) {
      res.status(400).json({
        success: false,
        message: "invalid request",
      });
      return;
    }

    let Post: any = null;
    if (postType === PostType.EVENT) Post = Event;
    else if (postType === PostType.NOTICE) Post = Notice;
    else {
      res.status(400).json({
        success: false,
        message: "invalid post type",
      });
      return;
    }

    let Target: any = null;
    if (targetType === ResourceType.COMMENT) Target = Comment;
    else if (targetType === ResourceType.EVENT) Target = Event;
    else if (targetType === ResourceType.NOTICE) Target = Notice;
    else {
      res.status(400).json({
        success: false,
        message: "invalid target type",
      });
      return;
    }

    const mediaUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadOnCloudinary(file.path);
        mediaUrls.push(url);
      }
    }

    const [post, target] = await Promise.all([
      Post.findById(postId),
      Target.findById(targetId),
    ]);

    if (!post || !target) {
      res.status(400).json({
        success: false,
        message: `${targetType} or ${postType} not found`,
      });
      return;
    }

    const createdComment = new Comment({
      content: commentContent,
      createdBy: user._id,
      parentId: targetType === ResourceType.COMMENT ? targetId : null,
      targetType,
      targetPostId: postId,
      mediaUrls,
    });

    if (targetType === ResourceType.COMMENT) {
      if (target.depth === 2) {
        res.status(422).json({
          success: false,
          message: "max comment depth reached",
        });
        return;
      }
      createdComment.depth = target.depth + 1;
      target.commentCount++;
      post.commentCount++;

      const [newComment, updatedTarget, updatedPost] = await Promise.all([
        await createdComment.save(),
        await target.save(),
        await post.save(),
      ]);

      res.status(201).json({
        success: true,
        message: "comment successfully created",
        data: [newComment, updatedTarget, updatedPost],
      });
      return;
    } else {
      post.commentCount++;

      const [newComment, updatedPost] = await Promise.all([
        await createdComment.save(),
        await post.save(),
      ]);

      res.status(201).json({
        success: true,
        message: "comment successfully created",
        data: [newComment, updatedPost],
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
    return;
  }
};

export const fetchNotices = async (req: Request, res: Response) => {
  const data = await Notice.find()
    .populate("createdBy", "name")
    .populate("category", "name");
  res.status(200).json({
    success: true,
    data: data,
  });
  return;
};

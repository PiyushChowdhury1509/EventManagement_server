import { Request, Response } from "express";
import { PostType, ResourceType } from "../Types/resource.types";
import { userType } from "../zod/user.zod";
import { Notice } from "../models/notice";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Comment } from "../models/comment";
import mongoose from "mongoose";

export const addComment = async (req: Request, res: Response) => {
  try {
    const { user } = req as any as { user: userType };
    console.log("user: ", user);
    const { postType, postId } = req.params;
    console.log("postType, PostId,", postType, postId);
    const { targetType, targetId, commentContent } = req.body as {
      targetType: ResourceType;
      targetId: string;
      commentContent: string;
    };
    console.log("target: ", targetType, targetId, commentContent);

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
    console.log("check 1");
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

export const getComments = async (req: Request, res: Response) => {
  try {
    const { postType } = req.params;
    const { postId, page = "1", limit = "10" } = req.query;

    if (!postType || !postId) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }

    const postObjectId = new mongoose.Types.ObjectId(postId as string);

    const allComments: any[] = await Comment.find({
      targetPostId: postObjectId,
      targetType: postType,
    })
      .populate("createdBy", "name profilePhotoUrl")
      .sort({ likeCount: -1, createdAt: -1 })
      .lean();

    const commentMap: Record<string, any> = {};
    allComments.forEach((comment) => {
      comment.replies = [];
      commentMap[comment._id.toString()] = comment;
    });

    const commentTree: any[] = [];
    allComments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId.toString()];
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        commentTree.push(comment);
      }
    });

    return res.status(200).json({
      success: true,
      data: commentTree,
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

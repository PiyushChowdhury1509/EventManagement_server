import mongoose, { Types, Document } from "mongoose";

interface IComment extends Document {
    content: string,
    createdBy: Types.ObjectId,
    parentId?: Types.ObjectId,
    targetType: string,
    targetPostId: Types.ObjectId,
    depth: number,
    likeCount: number,
    commentCount: 0,
    mediaUrls: string[],
}

const commentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String,
        required: true,
        maxLength: 1000
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    targetType: {
        type: String,
        enum: ["event", "notice"],
        required: true
    },
    targetPostId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    depth: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    mediaUrls: [{ type: String }]
}, { timestamps: true });

export const Comment = mongoose.model<IComment>('Comment',commentSchema);
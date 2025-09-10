import mongoose, { Types } from "mongoose";

export interface INotice {
  _id: string;
  name: string;
  content: string;
  category: string;
  createdBy: Types.ObjectId;
  likeCount: number;
  commentCount: number;
  date: Date;
}
const noticeSchema = new mongoose.Schema<INotice>(
  {
    name: {
      type: String,
      minLength: 1,
      maxLength: 255,
      required: true,
    },
    content: String,
    category: {
      type: String,
      default: "others",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>("Notice", noticeSchema);

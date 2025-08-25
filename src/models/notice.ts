import mongoose, { Document, Types } from "mongoose";

export interface INotice {
  _id: string;
  name: string;
  content: string;
  category: string;
  createdBy: string;
  likeCount: number,
  terminationDate: Date;
}
const noticeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 1,
      maxLength: 255,
      required: true,
    },
    content: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0
    },
    terminationDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>("Notice", noticeSchema);

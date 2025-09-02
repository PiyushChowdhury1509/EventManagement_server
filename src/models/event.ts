import mongoose, { Types, Document } from "mongoose";

export interface IEvent extends Document {
    name: string,
    description: string,
    date: Date,
    category: Types.ObjectId,
    createdBy: Types.ObjectId,
    participants?: Types.ObjectId[],
    files?: Types.ObjectId[],
    commentCount: number,
    likeCount: number,
    form?: Types.ObjectId
}

const eventSchema = new mongoose.Schema<IEvent>({
    name: {
        type: String,
        minLength: 1,
        maxLength: 255,
        required: true
    },
    description: String,
    date: {
        type: Date,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        }
    ],
    commentCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    }
}, { timestamps: true });

eventSchema.index({ date: 1 });


export const Event = mongoose.model('Event',eventSchema);
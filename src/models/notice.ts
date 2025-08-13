import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 1,
        maxLength: 255,
        required: true
    },
    content: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export const Notice = mongoose.model('Notice',noticeSchema);
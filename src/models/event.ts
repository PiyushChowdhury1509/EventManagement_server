import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
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
        required: true
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
    commentCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


export const Event = mongoose.model('Event',eventSchema);
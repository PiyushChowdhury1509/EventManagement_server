import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    targetType: {
        type: String,
        enum: ["notice", "event", "comment"],
        required: true
    },
    
    target: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true });

likeSchema.index(
    { userId: 1, target: 1},
    { unique: true }
);

export const Like = mongoose.model('Like', likeSchema);
import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },

    registeredAt: {
        type: Date,
        default: Date.now
    },

    responses: [
        {
            fieldLabel: String,
            answer: mongoose.Schema.Types.Mixed
        }
    ]
}, { timestamps: true } );

registrationSchema.index({ student: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
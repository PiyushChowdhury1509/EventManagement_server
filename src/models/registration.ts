import mongoose, { Types } from 'mongoose'

export interface IRegistration extends Document {
    student: Types.ObjectId,
    event: Types.ObjectId,
    registeredAt: Date,
    form?: Types.ObjectId,
    responses?: Types.ObjectId[]
};

const registrationSchema = new mongoose.Schema<IRegistration>({
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
        default: Date.now()
    },

    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
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
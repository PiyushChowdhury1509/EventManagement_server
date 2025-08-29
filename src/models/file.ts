import mongoose, { Document} from 'mongoose'

export interface IFile extends Document {
  url: string;
  type: string; 
  name: string; 
  size: number;
  uploadedAt: Date;
}

const fileSchema = new mongoose.Schema<IFile>({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now()
    }
}, { timestamps: true });

export const File = mongoose.model('File', fileSchema);
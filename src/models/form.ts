import mongoose, { Types, Document } from "mongoose";

interface FormField {
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
}

export interface IForm extends Document {
  name: string;
  fields: FormField[];
  createdBy: Types.ObjectId; 
  createdOn?: Date;
  createdAt?: Date; 
  updatedAt?: Date; 
}

const formSchema = new mongoose.Schema<IForm>({
    name: { type: String, required: true },
    fields: [
      {
        label: { 
          type: String, 
          required: true 
        },
        type: { 
          type: String, 
          required: true }, 
        options: [String],
        required: { type: Boolean, default: false },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", 
      required: true,
    },
    createdOn: {
      type: Date,
      default: Date.now()
    }
  },{ timestamps: true });

  formSchema.index({ createdOn: 1 });

  export const Form = mongoose.model('Form', formSchema);

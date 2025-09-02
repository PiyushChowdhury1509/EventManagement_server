import mongoose, { Types } from "mongoose";

interface FormField {
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
}
interface Document {
  _id:Types.ObjectId
}

export interface IForm extends Document  {
  name: string;
  fields: FormField[];
  createdBy: Types.ObjectId; 
  createdOn?: Date; 
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

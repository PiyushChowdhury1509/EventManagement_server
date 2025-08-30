import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
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
  },{ timestamps: true });

  export const Form = mongoose.model('Form', formSchema);

import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },     
  type: { type: String, required: true },      
  options: [String],                           
  required: { type: Boolean, default: false },
});

const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },     
    fields: [formFieldSchema],                  
  },
  { timestamps: true }
);

export default mongoose.model("Form", formSchema);
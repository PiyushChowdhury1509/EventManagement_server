import { z } from "zod";


const formFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "number", "date", "select", "checkbox", "radio", "file"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional().default(false),
});

const formSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  fields: z.array(formFieldSchema).min(1, "At least one field is required"),
});

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255),
  description: z.string().optional(),
  date: z.preprocess(
    (val) => (typeof val === "string" || val instanceof Date ? new Date(val) : val),
    z.date({ required_error: "Date is required" })
  ),
  category: z.string().optional(),
  form: formSchema.optional(),
  files: z.array(z.string().url("Invalid file URL")).optional(),
});

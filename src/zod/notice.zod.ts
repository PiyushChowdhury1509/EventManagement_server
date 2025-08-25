import { z } from 'zod'
import mongoose, { Types } from 'mongoose'

const objectIdSchema = z
.string()
.refine((value)=> mongoose.Types.ObjectId.isValid(value),{
    message: "invalid objectId"
});

type objectIdSchemaType = z.infer<typeof objectIdSchema>

export const zodNoticeSchema = z.object({
    name: z
    .string()
    .min(1)
    .max(255),

    content: z
    .string(),

    category: z
    .string()
    .min(1)
    .optional(),

    likes: z
    .optional(z.array(objectIdSchema))

})

export type noticeT = z.infer<typeof zodNoticeSchema>;
export type noticeType = noticeT & {_id: Types.ObjectId, createdBy: objectIdSchemaType};
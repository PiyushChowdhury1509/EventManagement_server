import { z } from 'zod'
import mongoose, { Types } from 'mongoose'

const objectIdSchema = z
.string()
.refine((value)=> mongoose.Types.ObjectId.isValid(value),{
    message: "invalid objectId"
});

export const zodNoticeSchema = z.object({
    name: z
    .string()
    .min(1)
    .max(255),

    content: z
    .string(),

    category: objectIdSchema,

    createdBy: objectIdSchema,

    likes: objectIdSchema.optional()
})

type noticeT = z.infer<typeof zodNoticeSchema>;
export type noticeType = noticeT & {_id: Types.ObjectId};
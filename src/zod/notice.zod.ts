import { z } from 'zod'
import mongoose, { Types } from 'mongoose'

const objectIdSchema = z
.string()
.refine((value)=> mongoose.Types.ObjectId.isValid(value),{
    message: "invalid objectId"
});


    const stringOrNumber = z.union([objectIdSchema.optional(), z.null()]);

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
    .optional(z.array(objectIdSchema)),

    terminationDate: z
    .coerce.date()

})

export type noticeT = z.infer<typeof zodNoticeSchema>;
export type noticeType = noticeT & {_id: string, createdBy:z.infer<typeof  stringOrNumber>};
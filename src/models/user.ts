import mongoose, { Document } from "mongoose";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
    name: string,
    email: string,
    password: string,
    profilePhotoUrl?: string,
    role: "admin" | "student",
    getJwt(): string
}

const UserSchema = new mongoose.Schema<IUser> ({
    name: {
        type: String,
        minLength: 1,
        maxLength: 255,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    profilePhotoUrl: {
        type: String,
        default: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAqQMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABAUBAgMGB//EADIQAAIBAwIEBAMHBQAAAAAAAAABAgMEESExBRJBUSIyYXFCgZETFSNSU2KxFDOCocH/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAEQH/2gAMAwEAAhEDEQA/APuIAAAAAAAAMZOc7inDTOX6AdQQ5XcnpGKS9dTm7iq/ix7AWAK37Wr+ozKr1V8efcCxBCjdzXmin7aHencwlo/C/UDsBkAAAAAAAAAAAAAAA0qVY01mT+RitVVKPdvZECc3N5k8sDerXnU0zhdkcgAAMnGrc0aLaqVEmugHUEP7yts7z9+U60ryhV8tVZ7PT+QO4BkDenVnT8r07Mm0q0aq8L1W6K4ym4vMdGgLQHG3rqosPSS3OwAAAAAAAAA1qTUIOTNiFd1OafIto7gcZzlOblI1AAGJNJNvRLr2Mlbxe4aSoRe+svbsByvOITqZhRfLDut5EAAqaAAIl2l9UoNRk3On2fT2LmE4zipReYvZnmyfwu45an2Mn4ZbejIq3AAVmLcZKUXhosKVRVIKXXqiuOtvU5KiztLRgWAAAAAAAANZy5YuT6IrXq8vcm3ksUsd2QQAAAHn72XNd1X+7H00PQHnrpYuaqf53/IHIAFZAAANoS5JxkujTNTKWWkt3ogPSgLRJAjQAALGhPnpxfXqdCLYy8Mo9tSUAAAAAARL56RRFJV98PzIoAAACo4tRcaqrJeGaw/ctzStShWpOnNZiwPOA7XNtO3nyz1XSXRnEqAAAErhtJ1blSa8MNX79DjQozuJqFJZfX0L21oRt6ShHV9X3ZDHUABQAASLJ4qtehNINl/d/wAScAAAAAARr1Zpp9mQyxrx56Ul9CuAAAAAGBicVOLjKKkn0ZBq8LpSeac5Q9Nyc3jdpe7OcrqhHetT+UsgV74TPOlWOPZnWnwqCealRy9I6Ikf11t+rH/ZtG7t5PStT+csAdKdONKPJTiox7I2MRkpeWSfsZQAAAAABJsV4pv5Ew4WkeWkm93qdwAAAAAAV1eHJVa6bosTjcUvtIZXmWwEADOM50wVd7xFtunbvTOsu/sBMuLulb6TlmX5Y7lfW4lWqP8ADxCPossg9dXkFStpznU885S92agBAAAZUpR1i2n6Ml0eI3FN4k1OP7t/qQwFXltfUa/hy4zfwy/4SjzJOs7+VPEKzc4dH1RFXBtTi5zUV1ZzhJSjzJ5T2ZPtKXLHna1ewHdJJJLZGQAAAAAAAAAKjjtCs6DnQ8u9RLdo82e6ZScT4NzuVa0WJbun0fsBQAzKMoNxnFxa3TWGjBUAAEAAAAAAGca4xqXPDODSm41bxNR6U8av3CtuAW9WUHUqaUPhT6v09C/RrGKikkkktkuhsRQAAAAAAAAAAAABFvLChdr8WHiW01o0Ud1wO4pNug1Vj0W0j0wA8PUpzpS5asJQfaSwaHuZRjJcskmn0aI8+HWc/NbU/ksfwEjxwPW/dFj+gvqzeHDbKHlt4fNZBHkYQlUeKcXJ9orJYWvBbqs06ijSj+7f6Hp4QhBYhFRXZLBsFQbLhdvZ+KEeap+eW/yJwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/9k="
    },
    role: {
        type: String,
        enum: ["admin","student"],
        default: "student",
        required: true
    }
}, { timestamps: true });

UserSchema.methods.getJwt = function(){
    const thisuser = this;
    const token = jwt.sign({_id: thisuser._id},process.env.JWT_SECRET!,{
        expiresIn: '7d'
    });
    return token
}

export const User = mongoose.model('User',UserSchema);
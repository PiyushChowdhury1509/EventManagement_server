import mongoose from "mongoose";

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("database connected");
    } catch (error){
        const err = error as Error;
        console.log("db connection failed: ",err);
    }
}

export default connectDB;
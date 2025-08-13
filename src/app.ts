import 'dotenv/config'
import express, { Express } from 'express'
import connectDB from './config/connectDB';
import cors from 'cors'
import compression from 'compression';
import cookieParser from 'cookie-parser'

const app:Express = express();

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(cookieParser());

import userRouter from './routes/user.route';
app.use('/api/v1/user',userRouter);

connectDB()
.then(()=>{
    const PORT = process.env.PORT;
    app.listen(PORT,()=>{
        console.log(`app is listening on port ${PORT}`);
    })
})
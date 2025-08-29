import 'dotenv/config'
import express, { Express } from 'express'
import connectDB from './config/connectDB';
import cors from 'cors'
import compression from 'compression';
import cookieParser from 'cookie-parser'

const app:Express = express();

app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


import authRouter from './routes/auth.route';
app.use('/api/v1/user', authRouter);

import adminRouter from './routes/admin.route';
app.use('/api/v1/admin', adminRouter);

import studentRouter from './routes/student.route';
app.use('/api/v1/student', studentRouter);


connectDB()
.then(()=>{
    const PORT = process.env.PORT;
    app.listen(PORT,()=>{
        console.log(`app is listening on port ${PORT}`);
    })
})
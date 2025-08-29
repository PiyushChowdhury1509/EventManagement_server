import { NextFunction, Router } from "express";
import { createNotice, createEvent } from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/userAuth";
import { upload } from "../middlewares/multer";


const adminRouter = Router();

adminRouter.post('/createNotice',adminAuth, createNotice);

adminRouter.post('/createEvent', upload.array("files",10), createEvent);

export default adminRouter;
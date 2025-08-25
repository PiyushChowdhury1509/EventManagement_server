import { Router } from "express";
import { createNotice } from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/userAuth";

const adminRouter = Router();

adminRouter.post('/createNotice',adminAuth, createNotice);

export default adminRouter;
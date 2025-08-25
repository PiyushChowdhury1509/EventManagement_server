import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import { getNotices, handleLike } from "../controllers/student.controller";

const studentRouter = Router();

studentRouter.get('/getNotices/:status',studentAuth, getNotices);
studentRouter.post('/handleLike/:like/:targetType/:targetId',studentAuth,handleLike);

export default studentRouter;
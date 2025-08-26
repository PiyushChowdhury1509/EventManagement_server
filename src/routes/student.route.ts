import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import { getNotices, handleComment, handleLike } from "../controllers/student.controller";

const studentRouter = Router();

studentRouter.get('/getNotices/:status',studentAuth, getNotices);
studentRouter.post('/handleLike/:like/:targetType/:targetId',studentAuth,handleLike);
studentRouter.post('/handleComment/:isAddComment/:targetType/:targetId',studentAuth,handleComment);

export default studentRouter;
import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import { getNotices, addComment, handleLike, deleteComment, fetchEvents } from "../controllers/student.controller";

const studentRouter = Router();

studentRouter.get('/getNotices/:status',studentAuth, getNotices);
studentRouter.get('/getEvents',studentAuth,fetchEvents);


//like apis
studentRouter.post('/handleLike/:like/:targetType/:targetId',studentAuth,handleLike);

//comment apis
studentRouter.post('/comment/add/:targetType/:targetId',studentAuth,addComment);
studentRouter.post('/comment/delete/:targetId',studentAuth, deleteComment);

export default studentRouter;
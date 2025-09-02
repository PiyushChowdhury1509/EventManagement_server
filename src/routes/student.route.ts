import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import { getNotices, addComment, handleLike, deleteComment, fetchEvents, registerEvent, fetchProfile } from "../controllers/student.controller";

const studentRouter = Router();

studentRouter.get('/getNotices/:status',studentAuth, getNotices);
studentRouter.get('/getEvents',studentAuth,fetchEvents);


//like apis
studentRouter.post('/handleLike/:like/:targetType/:targetId',studentAuth,handleLike);

//comment apis
studentRouter.post('/comment/add/:targetType/:targetId',studentAuth,addComment);
studentRouter.post('/comment/delete/:targetId',studentAuth, deleteComment);

studentRouter.post('/register/event', studentAuth, registerEvent);

studentRouter.get('/getProfile/:profileId',studentAuth,fetchProfile);

export default studentRouter;
import { Router } from "express";
import { addComment, getComments } from "../controllers/comment.controller";
import { adminAuth } from "../middlewares/userAuth";

const commentRouter = Router();

commentRouter.post("/postComment/:postType/:postId", adminAuth, addComment);
commentRouter.get("/getComment/:postType", adminAuth, getComments);

export default commentRouter;

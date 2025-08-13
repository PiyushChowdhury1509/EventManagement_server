import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller";

const userRouter = Router();

userRouter.post('/signup', createUser);
userRouter.post('/signin', loginUser);

export default userRouter;
import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller";

const authRouter = Router();

authRouter.post('/signup', createUser);
authRouter.post('/signin', loginUser);

export default authRouter;
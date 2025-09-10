import { Router } from "express";
import {
  createUser,
  loginUser,
  logoutUser,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup", createUser);
authRouter.post("/signin", loginUser);
authRouter.post("/logout", logoutUser);

export default authRouter;

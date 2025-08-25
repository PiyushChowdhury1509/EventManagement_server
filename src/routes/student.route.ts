import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import { getNotices } from "../controllers/student.controller";

const studentRouter = Router();

studentRouter.get('/getNotices/:status',studentAuth, getNotices);

export default studentRouter;
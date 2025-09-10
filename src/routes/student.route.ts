import { Router } from "express";
import { studentAuth } from "../middlewares/userAuth";
import {
  getNotices,
  addComment,
  handleLike,
  fetchEvents,
  registerEvent,
  fetchProfile,
  editProfile,
  getParticularResource,
  fetchAdminResources,
} from "../controllers/student.controller";
import { upload } from "../middlewares/multer";

const studentRouter = Router();

studentRouter.get("/getNotices", getNotices);
studentRouter.get("/getEvents", studentAuth, fetchEvents);
studentRouter.get(
  "/getParticularResource/:resourceId",
  studentAuth,
  getParticularResource
);

studentRouter.get(
  "/getAdminResources/:adminId",
  studentAuth,
  fetchAdminResources
);

//like apis
studentRouter.post(
  "/handleLike/:like/:targetType/:targetId",
  studentAuth,
  handleLike
);

//comment apis
studentRouter.post(
  "/comment/add/:targetType/:targetId",
  studentAuth,
  addComment
);
//studentRouter.post('/comment/delete/:targetId',studentAuth, deleteComment);

studentRouter.post("/register/event", studentAuth, registerEvent);

studentRouter.get("/getProfile/:profileId", studentAuth, fetchProfile);

studentRouter.patch(
  "/editProfile",
  studentAuth,
  upload.single("profile-photo"),
  editProfile
);

export default studentRouter;

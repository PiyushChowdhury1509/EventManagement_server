import { Router } from "express";
import { getParticularEvent } from "../controllers/event.controller";

const eventRouter = Router();

eventRouter.get("/:eventId", getParticularEvent);

export default eventRouter;

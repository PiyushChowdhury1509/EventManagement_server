import { Router } from "express";
import {
  getParticularEvent,
  fetchEvents,
} from "../controllers/event.controller";

const eventRouter = Router();

eventRouter.get("/:eventId", getParticularEvent);
eventRouter.get("/getEvents", fetchEvents);

export default eventRouter;

import { Request, Response } from "express";
import { Event } from "../models/event";

export const getParticularEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).lean();

    if (!event) {
      res.status(404).json({
        success: false,
        message: "event not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "event fetched successfully",
      data: event,
    });
    return;
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error,
    });
    return;
  }
};

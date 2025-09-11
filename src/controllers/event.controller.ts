import { Request, Response } from "express";
import { Event } from "../models/event";
import { EventRegistrationStatus, EventStatus } from "../Types/event.types";
import { Registration } from "../models/registration";
import { userType } from "../zod/user.zod";

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

export const fetchEvents = async (req: Request, res: Response) => {
  try {
    console.log("reached here");
    const { user } = req as any as { user: userType };
    console.log("req.query: ", req.query);
    let {
      page,
      limit,
      status = EventStatus.UPCOMING,
      categories,
      startDate,
      endDate,
      type = EventRegistrationStatus.NOTREGISTERED,
    } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "invalid pagination parameters",
      });
    }

    const registrations = await Registration.find({ student: user._id }).lean();
    const registrationIds = registrations.map((r) => r.event.toString());

    const filter: any = {};

    if (type === EventRegistrationStatus.REGISTERED) {
      filter._id = { $in: registrationIds };
    } else if (type === EventRegistrationStatus.NOTREGISTERED) {
      filter._id = { $nin: registrationIds };
    }

    switch (status) {
      case EventStatus.FINISHED:
        filter.date = { $lt: new Date() };
        break;

      case EventStatus.UPCOMING:
        filter.date = { $gte: new Date() };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "invalid status parameter",
        });
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    if (categories) {
      const categoryList = (categories as string)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((c) => c.toLowerCase());

      if (categoryList.length > 0) {
        filter.category = { $in: categoryList };
      }
    }

    const skip = (pageNum - 1) * limitNum;

    const events = await Event.find(filter)
      .skip(skip)
      .limit(limitNum)
      .populate("category", "name")
      .populate("createdBy", "name")
      .populate("files", "name size url")
      .lean();

    const totalCount = await Event.countDocuments(filter);

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "no events found",
        data: [],
        meta: { totalCount: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "events fetched successfully",
      data: events,
      meta: { totalCount },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      error,
    });
  }
};

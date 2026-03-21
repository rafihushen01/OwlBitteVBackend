import { Request, Response } from "express";
import mongoose from "mongoose";
import HomeBanner from "../models/HomeBanner.js";
import uploadoncloudinary from "../uploads/cloudinary.js";

type AuthenticatedRequest = Request & {
  user?: {
    _id?: mongoose.Types.ObjectId | string;
  };
};

const parseOrder = (value: unknown): number | null => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  return Array.isArray(req.files) ? req.files : [];
};

const uploadFilesToCloudinary = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  const uploadedUrls = await Promise.all(
    files.map(async (file) => uploadoncloudinary(file.path))
  );

  return uploadedUrls.filter((url): url is string => Boolean(url));
};

const hasValidObjectId = (id: string): boolean => mongoose.isValidObjectId(id);

const normalizeParamId = (value: string | string[] | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

// ================= CREATE =================
export const createhomebanner = async (req: Request, res: Response) => {
  try {
    const { order, navigationlink } = req.body;
    const parsedOrder = parseOrder(order);

    if (parsedOrder === null) {
      return res.status(400).json({ message: "Valid order is required" });
    }

    if (navigationlink !== undefined && typeof navigationlink !== "string") {
      return res.status(400).json({ message: "navigationlink must be a string" });
    }

    const files = getUploadedFiles(req);

    if (files.length === 0) {
      return res.status(400).json({ message: "At least one media file is required" });
    }

    const mediaUrls = await uploadFilesToCloudinary(files);

    if (mediaUrls.length === 0) {
      return res.status(500).json({ message: "Media upload failed" });
    }

    const currentUserId = (req as AuthenticatedRequest).user?._id;

    const banner = await HomeBanner.create({
      order: parsedOrder,
      media: mediaUrls,
      navigationlink: navigationlink ?? "",
      isactive: true,
      ...(currentUserId ? { createdBy: currentUserId } : {})
    });

    return res.status(201).json({
      message: "HomeBanner created successfully",
      banner
    });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= EDIT =================
export const edithomebanner = async (req: Request, res: Response) => {
  try {
    const id = normalizeParamId(req.params.id);
    const { order, navigationlink } = req.body;

    if (!id || !hasValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid banner id" });
    }

    const banner = await HomeBanner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const files = getUploadedFiles(req);

    if (files.length > 0) {
      const mediaUrls = await uploadFilesToCloudinary(files);

      if (mediaUrls.length === 0) {
        return res.status(500).json({ message: "Media upload failed" });
      }

      banner.media = mediaUrls;
    }

    if (order !== undefined) {
      const parsedOrder = parseOrder(order);

      if (parsedOrder === null) {
        return res.status(400).json({ message: "Valid order is required" });
      }

      banner.order = parsedOrder;
    }

    if (navigationlink !== undefined) {
      if (typeof navigationlink !== "string") {
        return res.status(400).json({ message: "navigationlink must be a string" });
      }

      banner.navigationlink = navigationlink;
    }

    await banner.save();

    return res.status(200).json({
      message: "HomeBanner updated successfully",
      banner
    });
  } catch (error) {
    console.error("EDIT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE =================
export const deletehomebanner = async (req: Request, res: Response) => {
  try {
    const id = normalizeParamId(req.params.id);

    if (!id || !hasValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid banner id" });
    }

    const banner = await HomeBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({
      message: "HomeBanner deleted successfully"
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= CHANGE STATUS =================
export const togglehomebannerstatus = async (req: Request, res: Response) => {
  try {
    const id = normalizeParamId(req.params.id);

    if (!id || !hasValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid banner id" });
    }

    const banner = await HomeBanner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isactive = !banner.isactive;

    await banner.save();

    return res.status(200).json({
      message: "Status updated successfully",
      isactive: banner.isactive
    });
  } catch (error) {
    console.error("TOGGLE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL FOR USERS =================
export const getactivehomebanners = async (_req: Request, res: Response) => {
  try {
    const banners = await HomeBanner.find({ isactive: true }).sort({ order: 1 }).lean();

    return res.status(200).json({
      count: banners.length,
      banners
    });
  } catch (error) {
    console.error("GET ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

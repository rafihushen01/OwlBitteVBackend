import { Request, Response } from "express";
import NavigationLink from "../models/NavigationLink.js";

export const createnavigationlink = async (req: Request, res: Response) => {
  try {
    let { path, label } = req.body;

    if (!path || typeof path !== "string") {
      return res.status(400).json({ message: "Path is required" });
    }

    // Ensure starts with /
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const existing = await NavigationLink.findOne({ path });
    if (existing) {
      return res.status(400).json({ message: "Path already exists" });
    }

    const link = await NavigationLink.create({
      path,
      label: label || path
    });

    return res.status(201).json({
      message: "Navigation link created",
      link
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getnavigationlinks = async (_req: Request, res: Response) => {
  try {
    const BASE_URL = "https://owlbite.vercel.app";

    const links = await NavigationLink.find({ isactive: true }).lean();

    const formatted = links.map((link) => ({
      _id: link._id,
      label: link.label,
      path: link.path,
      fullUrl: BASE_URL + link.path // 🔥 MAGIC HERE
    }));

    return res.status(200).json({
      count: formatted.length,
      links: formatted
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const deletenavigationlink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const link = await NavigationLink.findByIdAndDelete(id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const togglenavigationlink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const link = await NavigationLink.findById(id);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    link.isactive = !link.isactive;
    await link.save();

    return res.status(200).json({
      message: "Status updated",
      isactive: link.isactive
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

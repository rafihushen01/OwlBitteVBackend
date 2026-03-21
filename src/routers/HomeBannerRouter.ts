import express from "express";
import upload from "../middlewares/multer.js";
import {
  createhomebanner,
  edithomebanner,
  deletehomebanner,
  togglehomebannerstatus,
  getactivehomebanners
} from "../controllers/HomeBannerController.js";

const router = express.Router();

router.post("/create", upload.array("media",15), createhomebanner);
router.put("/edit/:id", upload.array("media",15), edithomebanner);
router.delete("/delete/:id", deletehomebanner);
router.patch("/toggle/:id", togglehomebannerstatus);
router.get("/all", getactivehomebanners);

export default router;
import express from "express";
import {
  createnavigationlink,
  getnavigationlinks,
  deletenavigationlink,
  togglenavigationlink
} from "../controllers/NavigationLinkController.js";

const router = express.Router();

router.post("/create", createnavigationlink);
router.get("/all", getnavigationlinks);
router.delete("/delete/:id", deletenavigationlink);
router.patch("/toggle/:id", togglenavigationlink);

export default router;
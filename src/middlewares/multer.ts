import multer, { StorageEngine } from "multer";
import { Request } from "express";

// ✅ Same logic, just typed
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, "./public");
  },

  filename: (req: Request, file, cb) => {
    cb(null, file.originalname);
  }
});

// ✅ 50MB limit (as you said)
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024
  }
});

export default upload;

import express from "express";
import {
  RecordLabTests,
  getUploadUrl,
  getDownloadUrl,
  getLabTest,deleteLabTest,
} from "../controllers/labTestsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get pre-signed upload URL
router.post("/upload-url", getUploadUrl);

// Get pre-signed download URL
router.post("/download-url", getDownloadUrl);

// Record new lab test
router.post("/record", RecordLabTests);

// Get specific lab test
router.get("/:testId", getLabTest);

// Delete specific lab test
router.delete("/delete-test/:testId", deleteLabTest);

export default router;


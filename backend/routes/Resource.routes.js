import express from "express";
import {
  assignResourceToUser,
  createResource,
  deleteResource,
  deleteResourceAssignment,
  fetchResource,
  fetchResources,
  getAllAssignments,
  getAllAssignmentsAuto,
  updateResource,
  uploadResourceImageController,
} from "../controllers/Resource.controller.js";
import upload from "../middleware/upload.middleware.js";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";

const router = express.Router();
router.get("/", fetchResources);
router.get("/:resourceId", fetchResource);
router.post("/", createResource);
router.put("/:resourceId", updateResource);
router.delete("/:resourceId", deleteResource);
router.post(
  "/:resourceId/upload-image",
  upload.single("image"),
  uploadResourceImageController
);

router.delete("/delete-assignment/:id", deleteResourceAssignment);
router.post("/assign-resource", assignResourceToUser);
router.get("/get-assignments/:userId", getAllAssignments);
router.get("/get-assignments-auto/", setSupabaseSession, getAllAssignmentsAuto);
export default router;

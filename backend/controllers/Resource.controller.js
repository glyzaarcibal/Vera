import {
  deleteResourceById,
  getAllResources,
  getOneResources,
  insertResource,
  updateResourceById,
  uploadResourceImage as uploadResourceImageService,
  updateResourceImage,
  assignToUserById,
  fetchAssignments,
  deleteUserAssignmentById,
} from "../service/Resources.service.js";

export const createResource = async (req, res) => {
  try {
    const formData = req.body;
    const resource = await insertResource(formData);
    return res.status(200).json({ message: "Success", resource });
  } catch (e) {
    console.error("Error creating resource:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateResource = async (req, res) => {
  try {
    const formData = req.body;
    const { resourceId } = req.params;
    await updateResourceById(resourceId, formData);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    await deleteResourceById(resourceId);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchResources = async (req, res) => {
  try {
    const resources = await getAllResources();
    return res.status(200).json({ resources });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const resources = await getOneResources(resourceId);
    return res.status(200).json({ resources });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const uploadResourceImageController = async (req, res) => {
  try {
    const { resourceId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = await uploadResourceImageService(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const updatedResource = await updateResourceImage(resourceId, imageUrl);
    return res.status(200).json({
      message: "Image uploaded successfully",
      resource: updatedResource,
    });
  } catch (e) {
    console.error("Error uploading resource image:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignResourceToUser = async (req, res) => {
  try {
    const formData = req.body;
    await assignToUserById(formData);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteResourceAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUserAssignmentById(id);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    console.error("Error deleting resource assignment:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const { userId } = req.params;
    const assignments = await fetchAssignments(userId);
    return res.status(200).json({ assignments });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllAssignmentsAuto = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(userId);
    const assignments = await fetchAssignments(userId);
    return res.status(200).json({ assignments });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

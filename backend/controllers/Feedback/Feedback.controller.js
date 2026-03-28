import { createFeedback, fetchFeedbacks } from "../../service/Feedback/Feedback.service.js";
import { uploadToSupabaseStorage } from "../../utils/storage.utils.js";

/**
 * Handle feedback/report submission
 * Body: { type: 'report'|'feedback', rating: number, description: string }
 * File: icon/screenshot (multer)
 */
export const submitFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const { type = "feedback", rating, description } = req.body;
    let imageUrl = null;

    if (req.file) {
      try {
        // Use an 'uploads' bucket. Assumes it exists in Supabase.
        imageUrl = await uploadToSupabaseStorage(
          req.file.buffer,
          "uploads",
          req.file.originalname,
          req.file.mimetype
        );
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        // Continue without image or return error? We'll continue for now.
      }
    }

    const feedbackData = {
      user_id: userId,
      type,
      rating: rating ? parseInt(rating) : null,
      description,
      image_url: imageUrl,
      status: "pending", // For admin review
    };

    const data = await createFeedback(feedbackData);
    return res.status(201).json({ message: "Feedback submitted successfully", data });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
};

/**
 * Get feedback list (admin view or user's perspective)
 * Query: ?type=report|feedback
 */
export const getFeedbacks = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;
    
    // Check if the current route is for 'all' (admin)
    const isAdminView = req.path.includes("/all");
    
    // If not admin view, filter by current user
    const filters = isAdminView ? { type } : { userId, type };
    const { data, total } = await fetchFeedbacks(filters);
    
    return res.status(200).json({ data, total });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return res.status(500).json({ message: "Failed to fetch feedbacks", error: error.message });
  }
};

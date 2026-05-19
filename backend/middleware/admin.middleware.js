import supabaseAdmin from "../utils/supabase.utils.js";

/**
 * Middleware to check if the authenticated user has admin role
 * Should be used after setSupabaseSession middleware
 */
export async function checkAdminRole(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
        error: "User not authenticated",
      });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(500).json({
        message: "Error verifying permissions",
        error: profileError.message,
      });
    }

    if (!profile || (profile.role !== "admin" && profile.role !== "psychology")) {
      return res.status(403).json({
        message: "Access denied",
        error: "Admin or Psychology privileges required",
      });
    }

    // Store profile in request for later use
    req.userProfile = profile;
    next();
  } catch (error) {
    console.error("Admin role check error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

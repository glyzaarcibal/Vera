import supabaseAdmin from "../../utils/supabase.utils.js";

export async function getAllUsers(params = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    role = "all",
    status = "all",
  } = params;

  // Fetch all users from auth
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  // Fetch profiles for all users in parallel
  const usersWithProfiles = await Promise.all(
    data.users.map(async (user) => {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return {
        ...user,
        profile,
      };
    })
  );

  // Apply filters
  let filteredUsers = usersWithProfiles;

  // Search filter (username or email)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        (user.profile?.username || "").toLowerCase().includes(searchLower) ||
        (user.email || "").toLowerCase().includes(searchLower)
    );
  }

  // Role filter
  if (role !== "all") {
    filteredUsers = filteredUsers.filter(
      (user) =>
        (user.profile?.role || "user").toLowerCase() === role.toLowerCase()
    );
  }

  // Status filter
  if (status !== "all") {
    filteredUsers = filteredUsers.filter((user) => {
      const userStatus = user.is_anonymous ? "inactive" : "active";
      return userStatus === status.toLowerCase();
    });
  }

  // Calculate pagination
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / limit);
  const offset = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);

  return {
    users: paginatedUsers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalUsers,
      limit: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getUserInfo(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

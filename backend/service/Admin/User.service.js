import supabaseAdmin from "../../utils/supabase.utils.js";

const getAgeGroup = (birthday) => {
  if (!birthday) return "Unknown";

  const [year, month, day] = birthday.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return "Unknown";

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasBirthdayPassed) age -= 1;
  if (age < 0) return "Unknown";
  if (age <= 12) return "Children";
  if (age <= 19) return "Teens";
  if (age <= 35) return "Young Adults";
  if (age <= 55) return "Adults";
  return "Seniors";
};

export async function getAllUsers(params = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    role = "all",
    status = "all",
    ageGroup = "all",
    sortOrder = "desc",
    exclude_roles = "",
    currentUserRole,
  } = params;

  // Fetch all users from auth (paginate because listUsers caps at 50 per page by default)
  let allAuthUsers = [];
  let currentPage = 1;
  const perPage = 50;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: currentPage, perPage });
    if (error) throw error;
    if (!data || !data.users || data.users.length === 0) break;
    
    allAuthUsers.push(...data.users);
    
    // Stop if we received fewer users than perPage (means we hit the last page)
    if (data.users.length < perPage) break;
    
    currentPage++;
  }

  // Fetch profiles for all users in a single query
  const userIds = allAuthUsers.map((user) => user.id);
  
  // Only query if we have users to avoid syntax errors with empty arrays
  let profilesMap = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      throw profilesError;
    }

    // Create a map for fast lookup
    profilesMap = profiles.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
  }

  const usersWithProfiles = allAuthUsers.map((user) => ({
    ...user,
    profile: profilesMap[user.id] ?? null,
  }));

  // Apply filters
  let filteredUsers = usersWithProfiles;

  // Restrict what Psychology users can see
  if (currentUserRole === 'psychology') {
    filteredUsers = filteredUsers.filter(
      (user) => (user.profile?.role || "user").toLowerCase() !== "admin"
    );
  }

  // Search filter (username or email)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        (user.profile?.username || "").toLowerCase().includes(searchLower) ||
        (user.email || "").toLowerCase().includes(searchLower)
    );
  }

  if (role !== "all") {
    filteredUsers = filteredUsers.filter(
      (user) =>
        (user.profile?.role || "user").toLowerCase() === role.toLowerCase()
    );
  }

  // Exclude roles filter
  if (exclude_roles) {
    const rolesToExclude = exclude_roles.split(",").map(r => r.toLowerCase().trim());
    filteredUsers = filteredUsers.filter(
      (user) => !rolesToExclude.includes((user.profile?.role || "user").toLowerCase())
    );
  }

  // Status filter
  if (status !== "all") {
    filteredUsers = filteredUsers.filter((user) => {
      const userStatus = user.is_anonymous ? "inactive" : "active";
      return userStatus === status.toLowerCase();
    });
  }

  // Age group filter
  if (ageGroup && ageGroup !== "all") {
    filteredUsers = filteredUsers.filter((user) => {
      const birthDateStr =
        user.profile?.birthday ||
        user.profile?.birthDate ||
        user.user_metadata?.birthday ||
        user.user_metadata?.birthDate;
      const userAgeGroup = getAgeGroup(birthDateStr);
      return userAgeGroup.toLowerCase() === ageGroup.toLowerCase();
    });
  }

  // Sort by Joined Date
  filteredUsers.sort((a, b) => {
    const dateA = new Date(a.profile?.created_at || a.created_at).getTime();
    const dateB = new Date(b.profile?.created_at || b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

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

export async function getDistinctRoles(currentUserRole) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role");
  if (error) throw error;
  
  let roles = [...new Set(data.map(profile => profile.role).filter(Boolean))];

  if (currentUserRole === 'psychology') {
    roles = roles.filter(r => r.toLowerCase() !== 'admin');
  }

  return roles.sort();
}

export async function getDistinctAgeGroups() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("birthday");
  if (error) throw error;
  
  const ageGroups = new Set();
  
  for (const profile of data) {
    const ageGroup = getAgeGroup(profile.birthday);
    if (ageGroup) {
      ageGroups.add(ageGroup);
    }
  }

  // Pre-defined sort order
  const order = ["Children", "Teens", "Young Adults", "Adults", "Seniors", "Unknown"];
  return Array.from(ageGroups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
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

export async function createUser(userData) {
  const { email, password, username, birthday, role } = userData;
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  console.log("Creating Supabase auth user for:", normalizedEmail);
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    user_metadata: { name: username, birthday },
    email_confirm: true,
  });

  if (error) {
    console.error("Supabase auth creation error:", error);
    throw error;
  }

  const userId = data.user.id;
  console.log("Auth user created:", userId, "- Now upserting profile...");

  // Upsert so admin-created users still get profile data if the trigger row is not present yet.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        role,
        username,
        birthday: birthday || null,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Error upserting profile:", profileError);
    throw profileError;
  }

  console.log("Profile upserted successfully for user:", userId);
  return data;
}

export async function updateUser(userId, userData) {
  const { email, password, username, birthday, role } = userData;
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  console.log("Updating Supabase auth user:", userId, "email:", normalizedEmail);

  let authUpdates = {
    email: normalizedEmail,
    user_metadata: { name: username, birthday },
  };
  if (password && password.trim() !== "") {
    authUpdates.password = password;
    console.log("Password update included in auth update");
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);

  if (error) {
    console.error("Supabase auth update error:", error);
    throw error;
  }

  console.log("Auth user updated successfully - Now upserting profile...");

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        role,
        username,
        birthday: birthday || null,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("Error updating profile:", profileError);
    throw profileError;
  }

  console.log("Profile upserted successfully for user:", userId);
  return data;
}

export async function deleteUser(userId) {
  // Optionally delete profile first if no DB cascade is set
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Detect emotion-hinting words from user messages
 * Returns words grouped by emotion category
 */
export async function detectEmotionWords(userId) {
  // Emotion word dictionaries
  const emotionWords = {
    critical: [
      'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all', 'self-harm', 'cutting', 'worthless', 'goodbye', 'no reason to live', 'death', 'dying', 'overdose',
      'magpakamatay', 'kitilin ang sarili', 'tapusin ang buhay', 'saktan ang sarili', 'walang kwenta', 'paalam', 'mamatay', 'kamatayan'
    ],
    sad: [
      'sad', 'depressed', 'unhappy', 'down', 'miserable', 'lonely', 'empty', 'hopeless', 'crying', 'tears', 'hurt', 'pain', 'sorrow', 'grief', 'disappointed', 'upset',
      'malungkot', 'depres', 'iyak', 'luha', 'sakit', 'pighati', 'bigo', 'sawis'
    ],
    angry: [
      'angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'frustrated', 'hate', 'resent', 'bitter', 'hostile', 'aggressive', 'outraged',
      'galit', 'inis', 'poot', 'suklam', 'yamot', 'gigil'
    ],
    happy: [
      'happy', 'joy', 'excited', 'glad', 'pleased', 'delighted', 'cheerful', 'ecstatic', 'thrilled', 'elated', 'content', 'satisfied', 'grateful',
      'masaya', 'galak', 'tuwa', 'ligaya', 'aliw', 'salamat'
    ],
    fearful: [
      'afraid', 'scared', 'fear', 'anxious', 'worried', 'nervous', 'panic', 'terrified', 'dread', 'apprehensive', 'uneasy', 'frightened',
      'takot', 'kaba', 'nerbyos', 'balisa', 'sindak', 'hilakbot'
    ],
    surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'gulat', 'mangha'],
    disgust: ['disgusted', 'revolted', 'sickened', 'repulsed', 'appalled', 'horrified', 'diri', 'suka'],
    doubt: ['doubt', 'doubtful', 'uncertain', 'uncertainty', 'unsure', 'questioning', 'skeptical', 'hesitant', 'suspicious', 'suspicion', 'duda', 'alinlangan'],
    confusion: ['confused', 'confusion', 'perplexed', 'bewildered', 'puzzled', 'muddled', 'disoriented', 'lost', 'baffled', 'lito', 'tarant'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'at ease', 'content', 'kalmado', 'payapa', 'pahinga'],
    neutral: ['okay', 'fine', 'alright', 'normal', 'regular', 'usual', 'ayos', 'tama']
  };

  // Get all sessions for the user
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId);

  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) {
    return { emotionWords: {}, totalWords: 0 };
  }

  const sessionIds = sessions.map(s => s.id);

  // Get all user messages (sent_by = 'user')
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("chat_messages")
    .select("content, created_at")
    .eq("sent_by", "user")
    .in("session_id", sessionIds);

  if (messagesError) throw messagesError;
  if (!messages || messages.length === 0) {
    return { emotionWords: {}, totalWords: 0 };
  }

  // Process messages to find emotion-hinting words
  const detectedWords = {};
  let totalWords = 0;

  messages.forEach(message => {
    if (!message.content) return;

    const text = message.content.toLowerCase();
    const words = text.split(/\s+/);
    totalWords += words.length;

    // Check each emotion category
    Object.keys(emotionWords).forEach(emotion => {
      if (!detectedWords[emotion]) {
        detectedWords[emotion] = [];
      }

      emotionWords[emotion].forEach(word => {
        // Check if word appears in the message
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(text)) {
          // Avoid duplicates
          if (!detectedWords[emotion].includes(word)) {
            detectedWords[emotion].push(word);
          }
        }
      });
    });
  });

  // Count occurrences and format results
  const result = {};
  Object.keys(detectedWords).forEach(emotion => {
    if (detectedWords[emotion].length > 0) {
      result[emotion] = {
        words: detectedWords[emotion],
        count: detectedWords[emotion].length
      };
    }
  });

  return {
    emotionWords: result,
    totalWords,
    totalMessages: messages.length
  };
}

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

  // Fetch profiles for all users in parallel (maybeSingle: no row = null, no error)
  const usersWithProfiles = await Promise.all(
    data.users.map(async (user) => {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      return {
        ...user,
        profile: profile ?? null,
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

export async function createUser(userData) {
  const { email, password, username, role } = userData;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { name: username },
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  const userId = data.user.id;

  // Update the profile with the role (assuming trigger creates initial profile)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role, username })
    .eq("id", userId);

  if (profileError) {
    console.error("Error updating profile role:", profileError);
  }

  return data;
}

export async function updateUser(userId, userData) {
  const { email, password, username, role } = userData;

  let authUpdates = { email, user_metadata: { name: username } };
  if (password && password.trim() !== "") {
    authUpdates.password = password;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);

  if (error) {
    throw error;
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role, username })
    .eq("id", userId);

  if (profileError) {
    console.error("Error updating profile:", profileError);
  }

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
    sad: ['sad', 'depressed', 'unhappy', 'down', 'miserable', 'lonely', 'empty', 'hopeless', 'crying', 'tears', 'hurt', 'pain', 'sorrow', 'grief', 'disappointed', 'upset'],
    angry: ['angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'frustrated', 'hate', 'resent', 'bitter', 'hostile', 'aggressive', 'outraged'],
    happy: ['happy', 'joy', 'excited', 'glad', 'pleased', 'delighted', 'cheerful', 'ecstatic', 'thrilled', 'elated', 'content', 'satisfied', 'grateful'],
    fearful: ['afraid', 'scared', 'fear', 'anxious', 'worried', 'nervous', 'panic', 'terrified', 'dread', 'apprehensive', 'uneasy', 'frightened'],
    surprised: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'],
    disgust: ['disgusted', 'revolted', 'sickened', 'repulsed', 'appalled', 'horrified'],
    doubt: ['doubt', 'doubtful', 'uncertain', 'uncertainty', 'unsure', 'questioning', 'skeptical', 'hesitant', 'suspicious', 'suspicion'],
    confusion: ['confused', 'confusion', 'perplexed', 'bewildered', 'puzzled', 'muddled', 'disoriented', 'lost', 'baffled'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'at ease', 'content'],
    neutral: ['okay', 'fine', 'alright', 'normal', 'regular', 'usual']
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

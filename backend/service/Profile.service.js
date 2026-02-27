import supabaseAdmin from "../utils/supabase.utils.js";

export async function fetchChatSessionsByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("*, chat_messages(*), doctor_notes(*, profiles(first_name, last_name))")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function fetchAppointmentsByUserId(userId) {
  try {
    // First, get all session IDs for this user
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, type, created_at")
      .eq("user_id", userId);

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get session IDs
    const sessionIds = sessions.map((s) => s.id);
    const sessionMap = {};
    sessions.forEach((s) => {
      sessionMap[s.id] = s;
    });

    // Now get all appointments (doctor_notes with next_appointment) for these sessions
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("doctor_notes")
      .select(
        `
        id,
        session_id,
        next_appointment,
        clinical_observations,
        problem_category,
        severity_rating,
        treatment_plan,
        doctor_id
        `
      )
      .in("session_id", sessionIds)
      .not("next_appointment", "is", null)
      .order("next_appointment", { ascending: false });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    // Transform the data to add chat_sessions and profiles information
    const enrichedAppointments = await Promise.all(
      (appointments || []).map(async (appointment) => {
        const sessionData = sessionMap[appointment.session_id];

        let doctorProfile = null;
        if (appointment.doctor_id) {
          try {
            const { data: profile, error: profileError } = await supabaseAdmin
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("id", appointment.doctor_id)
              .single();

            if (!profileError && profile) {
              doctorProfile = profile;
            }
          } catch (err) {
            console.error("Error fetching doctor profile:", err);
          }
        }

        return {
          ...appointment,
          chat_sessions: sessionData
            ? {
                id: String(sessionData.id),
                type: sessionData.type,
                created_at: sessionData.created_at,
              }
            : { id: String(appointment.session_id), type: "Unknown", created_at: null },
          profiles: doctorProfile || { id: null, first_name: "Unknown", last_name: "" },
        };
      })
    );

    return enrichedAppointments;
  } catch (err) {
    console.error("fetchAppointmentsByUserId error:", err);
    throw err;
  }
}

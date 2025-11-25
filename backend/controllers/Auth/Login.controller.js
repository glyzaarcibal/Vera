import {
  cookieConfig,
  refreshCookieConfig,
} from "../../config/cookie.config.js";
import { getProfile } from "../../service/Auth/Auth.service.js";
import { supabaseAnon } from "../../utils/supabase.utils.js";

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const { session, user } = data;
    const profile = await getProfile(user.id);

    if (profile.status === "inactive") throw new Error("account_inactive");

    res.cookie("access_token", session.access_token, cookieConfig);
    res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);

    return res.status(200).json({
      message: "success",
      profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e) {
    console.log(e);
    let message = "Internal Server Error";
    if (e.code === "email_not_confirmed")
      message =
        "Please verify your email to login (We sent you a link on your email)";
    if (e.code === "invalid_credentials")
      message = "Please check your email and password";
    return res.status(500).json({ message });
  }
};

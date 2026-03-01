import supabaseAdmin from "../../utils/supabase.utils.js";
import { uploadToSupabaseStorage } from "../../utils/storage.utils.js";
const FRONTEND_URL = process.env.FRONTEND_URL;
import { sendVerificationEmail, sendPasswordResetEmail } from "../Email.service.js";

import { v4 as uuidv4 } from "uuid";

export async function createUsers(user) {
  const token = uuidv4();

  // 1. Save to pending_users table
  const { error: insertError } = await supabaseAdmin
    .from('pending_users')
    .upsert({
      email: user.email,
      password: user.password,
      user_metadata: { name: user.username },
      token: token,
      created_at: new Date()
    });

  if (insertError) {
    console.error("Error saving pending user:", insertError);
    throw insertError;
  }

  // 2. Generate verification link
  const verificationLink = `${FRONTEND_URL}/email-verified?token=${token}`;

  // 3. Send verification email via Nodemailer
  try {
    await sendVerificationEmail(user.email, verificationLink);
    return { message: "Verification email sent" };
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    throw new Error("Failed to send verification email. Please try again later.");
  }
}

export async function verifyUserRegistration(token) {
  // 1. Find pending user
  const { data: pendingUser, error: findError } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('token', token)
    .single();

  if (findError || !pendingUser) {
    throw new Error("Invalid or expired verification token.");
  }

  // 2. Create user in Supabase Auth
  const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: pendingUser.email,
    password: pendingUser.password,
    user_metadata: pendingUser.user_metadata,
    email_confirm: true,
  });

  if (createError) {
    // If user already exists in Auth (e.g. from a previous partial run), 
    // we might want to handle it, but for now we'll throw.
    if (createError.code === "email_exists" || createError.message?.includes("already registered")) {
      // Proceed to delete from pending if they are already in Auth
    } else {
      throw createError;
    }
  }

  // 3. Delete from pending_users
  await supabaseAdmin
    .from('pending_users')
    .delete()
    .eq('id', pendingUser.id);

  // 4. Return user info so we can sign them in
  return {
    email: pendingUser.email,
    password: pendingUser.password,
    user: data.user
  };
}

export async function resendVerificationLink(email) {
  const requireEmailConfirmation =
    process.env.REQUIRE_EMAIL_CONFIRMATION === "true";

  if (!requireEmailConfirmation) return;

  // 1. Check if user is in pending_users
  const { data: pendingUser } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('email', email)
    .single();

  if (pendingUser) {
    // Generate new token or reuse? Let's generate new to be safe/fresh.
    const newToken = uuidv4();

    // Update token in db
    const { error: updateError } = await supabaseAdmin
      .from('pending_users')
      .update({ token: newToken, created_at: new Date() }) // Update timestamp too
      .eq('id', pendingUser.id);

    if (updateError) throw updateError;

    const verificationLink = `${FRONTEND_URL}/email-verified?token=${newToken}`;
    console.log(`Resending verification email to pending user ${email}`);
    await sendVerificationEmail(email, verificationLink);
    return;
  }

  // 2. Fallback to Supabase Auth (if they somehow exist there but need verification)
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: email,
    options: {
      redirectTo: `${FRONTEND_URL}/email-verified`
    }
  });

  if (error) throw error;

  const { properties } = data;

  if (properties && properties.action_link) {
    console.log(`Resending verification email to ${email}`);
    await sendVerificationEmail(email, properties.action_link);
  } else {
    throw new Error("No verification link generated");
  }
}

export async function findUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.log(error);
    return null;
  }
  const user = data.users.find((u) => u.email === email);
  return user || null;
}

export async function getProfile(id) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, profileData) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(profileData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Consolidated imports at the top

// ... existing code ...

export async function resetPasswordByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (error) throw error;

  const { properties } = data;

  if (properties && properties.action_link) {
    console.log(`Sending password reset email to ${email}`);
    await sendPasswordResetEmail(email, properties.action_link);
  } else {
    throw new Error("No password reset link generated");
  }
}

export async function uploadAvatar(fileBuffer, fileName, mimeType) {
  const publicUrl = await uploadToSupabaseStorage(
    fileBuffer,
    "avatars",
    fileName,
    mimeType
  );
  return publicUrl;
}

export async function updateAvatar(userId, avatarUrl) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePermissionsByUserId(userId, persmissions) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(persmissions)
    .eq("id", userId);
  if (error) throw error;
  return data;
}

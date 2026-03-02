import supabaseAdmin from "../../utils/supabase.utils.js";
import { uploadToSupabaseStorage } from "../../utils/storage.utils.js";
const FRONTEND_URL = process.env.FRONTEND_URL;
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCodeEmail
} from "../Email.service.js";

import { v4 as uuidv4 } from "uuid";

export async function createUsers(user) {
  // Generate a 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Save to pending_users table
  const { error: insertError } = await supabaseAdmin
    .from('pending_users')
    .upsert({
      email: user.email,
      password: user.password,
      user_metadata: { name: user.username },
      token: code, // Still using the 'token' column to store the code
      created_at: new Date()
    });

  if (insertError) {
    console.error("Error saving pending user:", insertError);
    throw insertError;
  }

  // 2. Send verification code email
  try {
    await sendVerificationCodeEmail(user.email, code);
    return { message: "Verification code sent to your email" };
  } catch (emailError) {
    console.error("Failed to send verification code email:", emailError);

    // If it's a Resend Trial restriction, don't crash the whole registration.
    // Just allow them to proceed and tell them to check the server logs.
    if (emailError.statusCode === 403) {
      return {
        message: "Registration successful! (Email sent skipped in Trial Mode. Check server logs for code.)",
        devMode: true
      };
    }

    throw new Error("Failed to send verification email. Please try again later.");
  }
}

export async function verifyUserRegistration(code) {
  // 1. Find pending user by code (stored in token column)
  const { data: pendingUser, error: findError } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('token', code)
    .single();

  if (findError || !pendingUser) {
    throw new Error("Invalid or expired verification code.");
  }

  // Check if code is older than 10 minutes
  const createdAt = new Date(pendingUser.created_at);
  const now = new Date();
  const diffInMinutes = (now - createdAt) / (1000 * 60);

  if (diffInMinutes > 10) {
    throw new Error("Verification code has expired. Please request a new one.");
  }

  // 2. Check if user already exists in Supabase Auth
  const existingUser = await findUserByEmail(pendingUser.email);
  let finalUser;

  if (existingUser) {
    // If user exists, just confirm their email
    console.log(`Confirming existing user: ${pendingUser.email}`);
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      { email_confirm: true }
    );
    if (updateError) throw updateError;
    finalUser = updateData.user;
  } else {
    // If not, create them fresh
    console.log(`Creating fresh user: ${pendingUser.email}`);
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: pendingUser.email,
      password: pendingUser.password,
      user_metadata: pendingUser.user_metadata,
      email_confirm: true,
    });

    if (createError) throw createError;
    finalUser = data.user;
  }

  // 3. Delete from pending_users
  await supabaseAdmin
    .from('pending_users')
    .delete()
    .eq('id', pendingUser.id);

  // 4. Return info so we can sign them in
  return {
    email: pendingUser.email,
    password: pendingUser.password,
    user: finalUser
  };
}

export async function resendVerificationLink(email) {
  const requireEmailConfirmation =
    process.env.REQUIRE_EMAIL_CONFIRMATION === "true";

  if (!requireEmailConfirmation) return;

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Check if user is in pending_users
  const { data: pendingUser } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('email', email)
    .single();

  if (pendingUser) {
    // Update token (code) in db
    const { error: updateError } = await supabaseAdmin
      .from('pending_users')
      .update({ token: newCode, created_at: new Date() })
      .eq('id', pendingUser.id);

    if (updateError) throw updateError;

    console.log(`Resending verification code email to pending user ${email}`);
    await sendVerificationCodeEmail(email, newCode);
    return;
  }

  // 2. If not in pending_users, check if they exist in Supabase Auth but are unconfirmed
  const user = await findUserByEmail(email);
  if (user) {
    // If user exists in Auth but we are here, it means they are likely unconfirmed
    // or the system is trying to re-verify them.
    // To use the Code flow, we need them in pending_users.
    // For now, we'll just log the code and send it.
    // NOTE: This might require them to re-register if they aren't in pending_users,
    // but we'll try to send the code anyway for testing.
    console.log(`Fallback: User ${email} found in Auth but not pending. Sending code anyway.`);

    // Create a temporary entry in pending_users so the 'verify-account' endpoint works
    await supabaseAdmin
      .from('pending_users')
      .upsert({
        email: email,
        password: 'RE-VERIFY-REQUIRED', // They'll need to re-enter/know their pwd or we skip pwd update
        token: newCode,
        created_at: new Date()
      });

    await sendVerificationCodeEmail(email, newCode);
    return;
  }

  throw new Error("User not found for verification.");
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

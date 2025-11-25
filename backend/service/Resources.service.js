import supabaseAdmin from "../utils/supabase.utils.js";
import { uploadToSupabaseStorage } from "../utils/storage.utils.js";

export async function insertResource(formData) {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .insert(formData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllResources() {
  const { data, error } = await supabaseAdmin.from("resources").select("*");
  if (error) throw error;
  return data;
}

export async function getOneResources(resourceId) {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateResourceById(resourceId, formData) {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .update(formData)
    .eq("id", resourceId);
  if (error) throw error;
  return data;
}

export async function deleteResourceById(resourceId) {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .delete()
    .eq("id", resourceId);
  if (error) throw error;
}

export async function uploadResourceImage(fileBuffer, fileName, mimeType) {
  const publicUrl = await uploadToSupabaseStorage(
    fileBuffer,
    "resources",
    fileName,
    mimeType
  );
  return publicUrl;
}

export async function updateResourceImage(resourceId, imageUrl) {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .update({ image_url: imageUrl })
    .eq("id", resourceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignToUserById(formData) {
  const { data, error } = await supabaseAdmin
    .from("user_resources")
    .insert(formData);
  if (error) throw error;
}

export async function deleteUserAssignmentById(id) {
  const { data, error } = await supabaseAdmin
    .from("user_resources")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function fetchAssignments(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_resources")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

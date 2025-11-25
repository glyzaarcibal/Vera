import supabaseAdmin from "./supabase.utils.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a file to a Supabase storage bucket
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} bucketName - The name of the Supabase storage bucket
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadToSupabaseStorage(
  fileBuffer,
  bucketName,
  fileName,
  mimeType
) {
  const fileExt = fileName.split(".").pop();
  const uniqueFileName = `${uuidv4()}.${fileExt}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(uniqueFileName, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucketName).getPublicUrl(data.path);

  return publicUrl;
}

import supabaseAdmin from "../../utils/supabase.utils.js";

/**
 * Get current token count for a user
 */
export async function getUserTokens(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return 0; // Not found
    throw error;
  }
  return data.tokens || 0;
}

/**
 * Deduct tokens from user
 * Throws error if not enough tokens
 */
export async function deductToken(userId, reason = "usage", amount = 1) {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (fetchError) throw fetchError;
  
  const currentTokens = profile.tokens || 0;
  
  if (currentTokens < amount) {
    throw new Error(`Insufficient tokens. You need ${amount} tokens but only have ${currentTokens}.`);
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ tokens: currentTokens - amount })
    .eq("id", userId);

  if (updateError) throw updateError;
  
  console.log(`[Token] Deducted ${amount} tokens from ${userId}. Reason: ${reason}. Remaining: ${currentTokens - amount}`);
  return currentTokens - amount;
}

/**
 * Add tokens to user
 */
export async function addTokens(userId, amount = 1, reason = "activity") {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (fetchError) throw fetchError;
  
  const currentTokens = profile.tokens || 0;
  const newBalance = currentTokens + amount;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ tokens: newBalance })
    .eq("id", userId);

  if (updateError) throw updateError;

  console.log(`[Token] Added ${amount} tokens to ${userId}. Reason: ${reason}. New balance: ${newBalance}`);
  return newBalance;
}

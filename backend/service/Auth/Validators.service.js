import { findUserByEmail } from "./Auth.service.js";

export async function userExists(email) {
  const user = await findUserByEmail(email);
  return user !== null;
}

export function isValidPassword(password) {
  return password && password.length >= 8;
}

import { createUsers, resendVerificationLink, verifyUserRegistration } from "../../service/Auth/Auth.service.js";
import {
  isValidPassword,
  userExists,
} from "../../service/Auth/Validators.service.js";

const getAgeFromBirthday = (birthday) => {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export const verifyAccount = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const data = await verifyUserRegistration(token);
    return res.status(200).json({ message: "Account verified successfully", data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Verification failed" });
  }
};

export const registerUser = async (req, res) => {
  const { email, password, username, birthday, birthDate } = req.body;
  const normalizedBirthday = birthday || birthDate;
  const isUserExisting = await userExists(email);
  const isPasswordValid = isValidPassword(password);

  if (!email || !password || !username || !normalizedBirthday) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields." });
  }

  const hasValidDate = !Number.isNaN(new Date(`${normalizedBirthday}T00:00:00`).getTime());
  if (!hasValidDate) {
    return res.status(422).json({ message: "Birthday is invalid." });
  }

  if (getAgeFromBirthday(normalizedBirthday) < 13) {
    return res
      .status(422)
      .json({ message: "You must be at least 13 years old to register." });
  }

  if (isUserExisting)
    return res.status(409).json({ message: "User already exists." });
  if (!isPasswordValid)
    return res.status(422).json({ message: "Password is invalid." });

  const formData = { email, password, username, birthday: normalizedBirthday };
  try {
    const userData = await createUsers(formData);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    console.log(e);
    if (e.code === "unexpected_failure")
      return res
        .status(400)
        .json({ message: "Invalid Email. Please try again" });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await resendVerificationLink(email);
    return res.status(200).json({ message: "Verification email sent." });
  } catch (e) {
    console.error("Resend verification error:", e);
    return res.status(500).json({ message: "Failed to send verification email." });
  }
};

import {
  getProfile,
  updateProfile,
  resetPasswordByEmail,
  uploadAvatar,
  updateAvatar,
  updatePermissionsByUserId,
  updatePasswordWithToken,
} from "../service/Auth/Auth.service.js";

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    await resetPasswordByEmail(email);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    console.error("Password reset error:", e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  }
};

export const confirmPasswordReset = async (req, res) => {
  const { token, password } = req.body;
  try {
    await updatePasswordWithToken(token, password);
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  }
};

export const retrieveProfileInformation = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await getProfile(userId);
    return res.status(200).json({ profile });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfileInformation = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, first_name, last_name, birthday, gender, contact_number } = req.body;

    const profileData = {};
    if (username !== undefined) profileData.username = username;
    if (first_name !== undefined) profileData.first_name = first_name;
    if (last_name !== undefined) profileData.last_name = last_name;
    if (birthday !== undefined)
      profileData.birthday = birthday === "" ? null : birthday;
    if (gender !== undefined) profileData.gender = gender;
    if (contact_number !== undefined) profileData.contact_number = contact_number;

    const updatedProfile = await updateProfile(userId, profileData);
    return res.status(200).json({ profile: updatedProfile });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const uploadProfileAvatar = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = await uploadAvatar(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const updatedProfile = await updateAvatar(userId, avatarUrl);
    return res.status(200).json({ profile: updatedProfile });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePermissions = async (req, res) => {
  try {
    const { permit_store, permit_analyze } = req.body;
    const userId = req.userId;
    const permissions = {
      permit_analyze,
      permit_store,
    };
    console.log(permissions);
    await updatePermissionsByUserId(userId, permissions);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

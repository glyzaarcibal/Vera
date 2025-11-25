import { createUsers } from "../../service/Auth/Auth.service.js";
import {
  isValidPassword,
  userExists,
} from "../../service/Auth/Validators.service.js";

export const registerUser = async (req, res) => {
  const { email, password, username } = req.body;
  const isUserExisting = await userExists(email);
  const isPasswordValid = isValidPassword(password);

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields." });
  }
  if (isUserExisting)
    return res.status(409).json({ message: "User already exists." });
  if (!isPasswordValid)
    return res.status(422).json({ message: "Password is invalid." });

  const formData = { email, password, username };
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

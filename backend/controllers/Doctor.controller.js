import { saveDoctorNote } from "../service/Doctor.Notes.js";

export const createDoctorNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const fetchedDoctorNote = req.body;
    const doctorNote = {
      ...fetchedDoctorNote,
      doctor_id: userId,
    };
    await saveDoctorNote(doctorNote);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

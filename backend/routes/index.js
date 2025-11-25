import AuthRoutes from "./Auth/Auth.routes.js";
import SessionRoutes from "./Chat/Session.routes.js";
import MessageRoutes from "./Chat/Message.routes.js";
import AdminUserRoutes from "./Admin/User.routes.js";
import ProfileRoutes from "./Profile.routes.js";
import MoodsRoutes from "./Moods.routes.js";
import DoctorRoutes from "./Doctor.routes.js";
import ResourceRoutes from "./Resource.routes.js";

export default function registerRoutes(app) {
  app.use("/api/auth", AuthRoutes);
  app.use("/api/sessions", SessionRoutes);
  app.use("/api/messages", MessageRoutes);
  app.use("/api/admin/users", AdminUserRoutes);
  app.use("/api/profile", ProfileRoutes);
  app.use("/api/moods", MoodsRoutes);
  app.use("/api/doctor", DoctorRoutes);
  app.use("/api/resources", ResourceRoutes);

  app.use("/", (req, res) => {
    res.send("Server is Up!");
  });
}

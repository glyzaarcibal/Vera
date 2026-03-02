import express from "express";
import morgan from "morgan";
import registerRoutes from "./routes/index.js";
import corsConfig from "./config/cors.config.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.set("trust proxy", 1);

app.use(cors(corsConfig));
app.use(express.json({ limit: "50mb" }));
app.use(morgan("tiny"));
app.use(cookieParser());
registerRoutes(app);

export default app;

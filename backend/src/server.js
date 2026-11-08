import cors from "cors";
import "dotenv/config";
import express from "express";
import healthRoutes from "./routes/healthRoutes.js";
import offeringRoutes from "./routes/offeringRoutes.js";
import pickupRequestRoutes from "./routes/pickupRequestRoutes.js";
import distributionRoutes from "./routes/distributionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/offerings", offeringRoutes);
app.use("/api/pickup-requests", pickupRequestRoutes);
app.use("/api/distributions", distributionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend démarré sur le port ${port}`);
});

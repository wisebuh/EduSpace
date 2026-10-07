import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import adminDashboardRoutes from "./modules/adminDashboard/adminDashboard.routes";
import announcementsRoutes from "./modules/announcements/announcement.routes";
import assignmentsRoutes from "./modules/assignments/assignment.routes";
import authRoutes from "./modules/auth/auth.routes";
import classesRoutes from "./modules/classes/classes.routes";
import courseUploadRoutes from "./modules/courseUpload/courseUpload.routes";
import coursesRoutes from "./modules/courses/courses.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import notificationsRoutes from "./modules/notifications/notification.routes";
import submissionsRoutes from "./modules/submissions/submission.routes";
import usersRoutes from "./modules/users/users.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Slow down password guessing.
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/notifications", notificationsRoutes);

// These routers define their own full paths (e.g. /courses/:id/classes).
app.use("/api", classesRoutes);
app.use("/api", assignmentsRoutes);
app.use("/api", courseUploadRoutes);
app.use("/api", submissionsRoutes);

app.use(notFound);
app.use(errorHandler);
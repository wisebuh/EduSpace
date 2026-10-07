import { useEffect, useState } from "react";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_EDUSPACE_API_URL ?? "http://localhost:4000";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
  emailNotificationsEnabled?: boolean;
};

export type AppSession = {
  user: AppUser | null;
  loading: boolean;
};

export type AppClass = {
  id: string;
  name: string;
  schedule?: string | null;
  startsAt?: string | null;
  cohortStartDate?: string | null;
  cohortEndDate?: string | null;
  meetingUrl?: string | null;
  _count?: { assignments?: number; enrollments?: number };
  course?: {
    id: string;
    title: string;
    teacher?: { id: string; name: string };
  };
};

export type AppCourse = {
  id: string;
  title: string;
  description?: string | null;
  published?: boolean;
  teacher?: { id: string; name: string; avatarUrl?: string | null };
  classes?: AppClass[];
  enrollment?: { classId: string | null; class: AppClass | null } | null;
  isEnrolled?: boolean;
  _count?: { enrollments?: number; classes?: number };
};

export type AppSubmission = {
  id: string;
  content?: string | null;
  fileUrl?: string | null;
  submittedAt: string;
  grade?: number | null;
  feedback?: string | null;
  assignment: {
    id: string;
    title: string;
    maxScore: number;
    dueDate?: string | null;
    class: {
      name: string;
      course?: { title: string } | null;
    };
  };
};

export type AppAssignment = {
  id: string;
  title: string;
  description?: string | null;
  maxScore?: number;
  dueDate?: string | null;
  class?: {
    id?: string;
    name: string;
    course?: { id: string; title: string } | null;
  };
  _count?: { submissions?: number };
  mySubmission?: {
    id: string;
    grade?: number | null;
    submittedAt: string;
  } | null;
};

export type AppAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  course: { id: string; title: string };
  author: { id: string; name: string };
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach the EduSpace API at ${API_BASE_URL}. Start the API server and try again.`
    );
  }

  const text = await response.text();
  let data: Record<string, unknown> | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const validationMessages = data?.errors
      ? Object.values(data.errors as Record<string, unknown>)
          .flatMap((messages) => (Array.isArray(messages) ? messages : []))
          .filter((message): message is string => typeof message === "string")
      : [];
    const responseMessage =
      validationMessages[0] ??
      data?.error ??
      data?.message ??
      `Request failed with status ${response.status}`;
    const isRegistrationFailure =
      path === "/api/auth/register" &&
      (response.status >= 500 || responseMessage === "Something went wrong. Please try again");
    const message = isRegistrationFailure
      ? `The account service could not complete signup. Check that PostgreSQL is running, run "npx prisma db push" in eduspace-api, configure SMTP_HOST, SMTP_PORT, and SMTP_FROM, then restart the API. Server response: ${responseMessage}`
      : responseMessage;
    throw new Error(message);
  }

  return (data as T) ?? ({} as T);
}

export async function getCurrentUser() {
  const data = await request<{ user?: AppUser }>("/api/auth/me");
  return data.user ?? null;
}

export async function getGoogleAuthStatus() {
  const data = await request<{ enabled: boolean }>("/api/auth/google/config");
  return data.enabled;
}

export async function loginUser(payload: { email: string; password: string }) {
  const data = await request<{ user?: AppUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user ?? null;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  phoneCountryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
}) {
  return request<{ email: string; emailSent: boolean; message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string) {
  return request<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationEmail(email: string) {
  return request<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function logoutUser() {
  return request<{ message?: string }>("/api/auth/logout", { method: "POST" });
}

export async function deleteMyAccount() {
  await request<void>("/api/users/me", { method: "DELETE" });
}

export async function updateProfile(payload: {
  name?: string;
  email?: string;
  emailNotificationsEnabled?: boolean;
}) {
  const data = await request<{ user?: AppUser }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.user ?? null;
}

export async function fetchDashboard() {
  return request<{
    role?: string;
    stats?: Record<string, unknown>;
    upcomingAssignments?: Array<Record<string, unknown>>;
  }>("/api/dashboard");
}

export async function fetchAdminDashboard() {
  return request<{
    stats: {
      totalUsers: number;
      usersByRole: Record<string, number>;
      newUsersThisWeek: number;
      totalCourses: number;
      publishedCourses: number;
      draftCourses: number;
      enrollments: number;
      submissions: number;
      waitingForGrade: number;
    };
    recentUsers: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
    recentCourses: Array<{ id: string; title: string; published: boolean; teacher: { name: string } }>;
    popularCourses: Array<{ id: string; title: string; _count: { enrollments: number } }>;
  }>("/api/admin/dashboard");
}

export async function fetchAssignments() {
  return request<{ assignments?: AppAssignment[] }>("/api/assignments");
}

export async function fetchMySubmissions() {
  return request<{ submissions?: AppSubmission[] }>("/api/submissions/mine");
}

export async function submitAssignment(
  assignmentId: string,
  payload: { content?: string | null; fileUrl?: string | null }
) {
  return request<{ submission: AppSubmission }>(`/api/assignments/${assignmentId}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCourses() {
  return request<{ courses?: AppCourse[] }>("/api/courses?mine=true");
}

export async function fetchMyCourses() {
  return request<{ courses?: Array<Record<string, unknown>> }>("/api/courses?mine=true");
}

export async function fetchAvailableCourses() {
  return request<{ courses?: AppCourse[] }>("/api/courses");
}

export async function createCourse(payload: {
  title: string;
  description?: string;
  published?: boolean;
}) {
  return request<{ course: AppCourse }>("/api/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAssignment(
  classId: string,
  payload: { title: string; description?: string; dueDate?: string; maxScore: number }
) {
  return request<{ assignment: AppAssignment }>(`/api/classes/${classId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadCourseMaterial(
  courseId: string,
  file: File,
  title?: string
) {
  const formData = new FormData();
  formData.set("file", file);
  if (title) formData.set("title", title);
  return request<{ material: { id: string; title: string } }>(
    `/api/courses/${courseId}/materials`,
    { method: "POST", body: formData }
  );
}

export async function fetchAnnouncements(courseId?: string) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return request<{ announcements?: AppAnnouncement[] }>(`/api/announcements${query}`);
}

export async function createAnnouncement(payload: {
  courseId: string;
  title: string;
  body: string;
}) {
  return request<{ announcement: AppAnnouncement }>("/api/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteAnnouncement(id: string) {
  return request<void>(`/api/announcements/${id}`, { method: "DELETE" });
}

export async function fetchNotifications() {
  return request<{ notifications: AppNotification[]; unreadCount: number }>(
    "/api/notifications"
  );
}

export async function markNotificationRead(id: string) {
  return request<void>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return request<void>("/api/notifications/read-all", { method: "PATCH" });
}

export async function enrollInCourse(courseId: string, classId: string) {
  return request<{ enrollment?: { id: string; classId: string } }>(`/api/courses/${courseId}/enroll`, {
    method: "POST",
    body: JSON.stringify({ classId }),
  });
}

export async function fetchMyClasses() {
  return request<{ classes?: AppClass[] }>("/api/classes/mine");
}

export type ClassPayload = {
  name: string;
  schedule?: string | null;
  startsAt?: string | null;
  cohortStartDate?: string | null;
  cohortEndDate?: string | null;
  meetingUrl?: string | null;
};

export async function createCourseClass(courseId: string, payload: ClassPayload) {
  return request<{ class: AppClass }>(`/api/courses/${courseId}/classes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourseClass(classId: string, payload: Partial<ClassPayload>) {
  return request<{ class: AppClass }>(`/api/classes/${classId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchLmsResources() {
  const data = await fetchCourses();
  return data.courses ?? [];
}

export function useAppSession() {
  const [session, setSession] = useState<AppSession>({ user: null, loading: true });

  useEffect(() => {
    let ignore = false;

    getCurrentUser()
      .then((user) => {
        if (!ignore) {
          setSession({ user, loading: false });
        }
      })
      .catch(() => {
        if (!ignore) {
          setSession({ user: null, loading: false });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return session;
}

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
  fileName?: string | null;
  submittedAt: string;
  grade?: number | null;
  feedback?: string | null;
  assignment: {
    id: string;
    title: string;
    type?: "ASSIGNMENT" | "PROJECT";
    maxScore: number;
    attachmentName?: string | null;
    attachmentMimeType?: string | null;
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
  type?: "ASSIGNMENT" | "PROJECT";
  maxScore?: number;
  dueDate?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
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
    content?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileMimeType?: string | null;
    feedback?: string | null;
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

async function protectedFileBlob(path: string) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  } catch {
    throw new Error(`Cannot reach the EduSpace API at ${API_BASE_URL}. Start the API server and try again.`);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `File request failed with status ${response.status}`;
    if (text) {
      try {
        const data = JSON.parse(text) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
      } catch {
        message = text;
      }
    }
    throw new Error(message);
  }
  return response.blob();
}

export async function downloadProtectedFile(path: string, filename: string) {
  const blob = await protectedFileBlob(path);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function fetchProtectedFileUrl(path: string) {
  return protectedFileBlob(path).then((blob) => URL.createObjectURL(blob));
}

export async function openProtectedFile(path: string) {
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error("Allow pop-ups to preview this file.");

  try {
    const blob = await protectedFileBlob(path);
    const objectUrl = URL.createObjectURL(blob);
    tab.opener = null;
    tab.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    tab.close();
    throw error;
  }
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

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatarUrl?: string | null;
  createdAt: string;
  _count: { enrollments: number; coursesTeaching: number };
};

export type AdminCourseItem = {
  id: string;
  title: string;
  published: boolean;
  createdAt: string;
  teacher: { id: string; name: string };
  _count: { enrollments: number; classes: number; materials: number };
};

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

export async function fetchAdminUsers(params: {
  q?: string;
  role?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role) query.set("role", params.role);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();
  return request<{
    users: AdminUserItem[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

export async function updateUserRole(userId: string, role: string) {
  return request<{ user: AdminUserItem }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminUser(userId: string) {
  return request<void>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function fetchAdminCourses(params: {
  q?: string;
  published?: "true" | "false";
  page?: number;
  pageSize?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.published) query.set("published", params.published);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();
  return request<{
    courses: AdminCourseItem[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/admin/courses${qs ? `?${qs}` : ""}`);
}

export async function setAdminCoursePublished(courseId: string, published: boolean) {
  return request<{ course: AdminCourseItem }>(`/api/admin/courses/${courseId}/publish`, {
    method: "PATCH",
    body: JSON.stringify({ published }),
  });
}

export async function fetchAssignments() {
  return request<{ assignments?: AppAssignment[] }>("/api/assignments");
}

export async function fetchMySubmissions() {
  return request<{ submissions?: AppSubmission[] }>("/api/submissions/mine");
}

export async function submitAssignment(
  assignmentId: string,
  payload: { content?: string | null; fileUrl?: string | null; file?: File }
) {
  if (payload.file) {
    const formData = new FormData();
    formData.set("file", payload.file);
    if (payload.content) formData.set("content", payload.content);
    if (payload.fileUrl) formData.set("fileUrl", payload.fileUrl);
    return request<{ submission: AppSubmission }>(
      `/api/assignments/${assignmentId}/submissions/file`,
      { method: "POST", body: formData }
    );
  }
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

export async function deleteCourse(courseId: string) {
  return request<void>(`/api/courses/${courseId}`, { method: "DELETE" });
}

export async function unenrollFromCourse(courseId: string) {
  return request<void>(`/api/courses/${courseId}/enroll`, { method: "DELETE" });
}

export async function createAssignment(
  classId: string,
  payload: {
    title: string;
    description?: string;
    type?: "ASSIGNMENT" | "PROJECT";
    dueDate?: string;
    maxScore: number;
  },
  file?: File
) {
  if (file) {
    const formData = new FormData();
    formData.set("title", payload.title);
    formData.set("description", payload.description ?? "");
    formData.set("type", payload.type ?? "ASSIGNMENT");
    if (payload.dueDate) formData.set("dueDate", payload.dueDate);
    formData.set("maxScore", String(payload.maxScore));
    formData.set("file", file);
    return request<{ assignment: AppAssignment }>(`/api/classes/${classId}/assignments`, {
      method: "POST",
      body: formData,
    });
  }
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

export type AppMaterial = {
  id: string;
  courseId: string;
  title: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  course?: { title: string };
  uploadedBy?: { name: string };
};

export async function fetchMyMaterials() {
  return request<{ materials: AppMaterial[] }>("/api/materials/mine");
}

export async function fetchCourseMaterials(courseId: string) {
  return request<{ materials: AppMaterial[] }>(`/api/courses/${courseId}/materials`);
}

export function getMaterialViewUrl(id: string) {
  return `/api/materials/${encodeURIComponent(id)}/view`;
}

export function getMaterialDownloadUrl(id: string) {
  return `/api/materials/${encodeURIComponent(id)}/download`;
}

export async function fetchMaterialBlob(id: string) {
  return protectedFileBlob(getMaterialViewUrl(id));
}

export async function downloadMaterial(id: string, filename: string) {
  return downloadProtectedFile(getMaterialDownloadUrl(id), filename);
}

export async function downloadAssignmentAttachment(id: string, filename: string) {
  return downloadProtectedFile(`/api/assignments/${encodeURIComponent(id)}/attachment/download`, filename);
}

export async function downloadSubmissionFile(id: string, filename: string) {
  return downloadProtectedFile(`/api/submissions/${encodeURIComponent(id)}/file`, filename);
}

export async function deleteCourseMaterial(id: string) {
  return request<void>(`/api/materials/${id}`, { method: "DELETE" });
}

export type AppGradebookStudent = {
  student: { id: string; name: string; email: string; avatarUrl?: string | null };
  assignmentSubmissions: Array<{
    assignmentId: string;
    submissionId: string | null;
    title: string;
    maxScore: number;
    submitted: boolean;
    grade: number | null;
    feedback: string | null;
    submittedAt: string | null;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
  }>;
  projectSubmissions: Array<{
    assignmentId: string;
    submissionId: string | null;
    title: string;
    maxScore: number;
    submitted: boolean;
    grade: number | null;
    feedback: string | null;
    submittedAt: string | null;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
  }>;
  completedAssignmentsCount: number;
  totalAssignmentsCount: number;
  assignmentCompletionRate: number;
  assignmentAverage: number | null;
  completedProjectsCount: number;
  totalProjectsCount: number;
  projectCompletionRate: number;
  projectAverage: number | null;
  attendanceRecords: Array<{
    id: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
    notes?: string | null;
  }>;
  attendancePercentage: number;
  examScore: number | null;
  gradeBreakdown: {
    assignmentPoints: number;
    attendancePoints: number;
    examPoints: number;
    total: number;
  };
  totalSessions: number;
  presentCount: number;
  overallGrade: number | null;
  isEligibleForCertificate: boolean;
  certificate?: AppCertificate | null;
};

export type AppGradebook = {
  class: { id: string; name: string; courseId: string; courseTitle: string };
  gradingWeights: { assignment: 7.5; attendance: 20; exam: 50 };
  assignments: Array<{ id: string; title: string; maxScore: number; type: string }>;
  projects: Array<{ id: string; title: string; maxScore: number; type: string }>;
  students: AppGradebookStudent[];
};

export async function fetchGradebook(classId: string) {
  return request<AppGradebook>(`/api/classes/${classId}/gradebook`);
}

export async function updateStudentGrade(
  classId: string,
  payload: { studentId: string; assignmentId: string; grade: number; feedback?: string }
) {
  return request<{ submission: Record<string, unknown> }>(`/api/classes/${classId}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExamGrade(
  classId: string,
  payload: { studentId: string; score: number }
) {
  return request<{ enrollment: { examScore: number } }>(`/api/classes/${classId}/exam-grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordAttendance(
  classId: string,
  payload: {
    records: Array<{
      studentId: string;
      date?: string;
      status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
      notes?: string;
    }>;
  }
) {
  return request<{ records: Array<Record<string, unknown>> }>(`/api/classes/${classId}/attendance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type AppTodayAttendance = {
  classId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
};

export async function fetchMyTodayAttendance() {
  return request<{ records: AppTodayAttendance[] }>("/api/attendance/mine/today");
}

export async function checkInToClass(classId: string) {
  return request<{ record: AppTodayAttendance }>(`/api/classes/${classId}/attendance/check-in`, {
    method: "POST",
  });
}

export type AppStudentGradeSummary = {
  course: { id: string; title: string; description?: string | null; teacher?: { name: string } };
  class: { id: string; name: string; cohortEndDate?: string | null } | null;
  cohortCompleted: boolean;
  attendancePercentage: number;
  examScore: number | null;
  gradeBreakdown: {
    assignmentPoints: number;
    attendancePoints: number;
    examPoints: number;
    total: number;
  };
  assignmentCompletionRate: number;
  projectCompletionRate: number;
  overallGrade: number | null;
  isEligibleForCertificate: boolean;
  certificate: AppCertificate | null;
};

export async function fetchMyGrades() {
  return request<{ grades: AppStudentGradeSummary[] }>("/api/grades/mine");
}

export type AppCertificate = {
  id: string;
  certificateCode: string;
  userId: string;
  courseId: string;
  classId?: string | null;
  issuedAt: string;
  attendancePercentage: number;
  assignmentCompletion: number;
  projectCompletion: number;
  overallGrade?: number | null;
  user?: { name: string; email: string; avatarUrl?: string | null };
  course?: { id: string; title: string; description?: string | null; teacher?: { name: string } };
  class?: { name: string } | null;
};

export async function checkCertificateEligibility(courseId: string) {
  return request<{
    eligible: boolean;
    alreadyIssued: boolean;
    reason?: string;
    certificate?: AppCertificate;
    stats: {
      attendancePercentage: number;
      assignmentCompletion: number;
      projectCompletion: number;
      overallGrade: number | null;
    };
  }>(`/api/courses/${courseId}/certificate-eligibility`);
}

export async function issueCertificate(courseId: string) {
  return request<{ certificate: AppCertificate }>(`/api/courses/${courseId}/issue-certificate`, {
    method: "POST",
  });
}

export async function fetchMyCertificates() {
  return request<{ certificates: AppCertificate[] }>("/api/certificates/mine");
}

export async function verifyCertificate(code: string) {
  return request<{ certificate: AppCertificate }>(`/api/certificates/verify/${code}`);
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
